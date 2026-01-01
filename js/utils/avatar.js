/**
 * Avatar Utilities
 * Handles profile pictures, initials generation, and image compression
 */

const AvatarUtils = (function() {
    // Vibrant color palette for initials backgrounds
    const AVATAR_COLORS = [
        '#6366F1', // Indigo
        '#8B5CF6', // Violet
        '#EC4899', // Pink
        '#EF4444', // Red
        '#F97316', // Orange
        '#F59E0B', // Amber
        '#10B981', // Emerald
        '#14B8A6', // Teal
        '#06B6D4', // Cyan
        '#3B82F6', // Blue
        '#6D28D9', // Purple
        '#DB2777'  // Fuchsia
    ];

    // Avatar size constants
    const AVATAR_SIZE = 256;  // Storage size
    const JPEG_QUALITY = 0.85;

    /**
     * Generate initials from a name
     * @param {string} name - Full name
     * @returns {string} - 1-2 character initials
     */
    function generateInitials(name) {
        if (!name || typeof name !== 'string') return '?';

        const words = name.trim().split(/\s+/).filter(w => w.length > 0);

        if (words.length === 0) return '?';
        if (words.length === 1) {
            // Single word: take first 1-2 characters
            return words[0].substring(0, 2).toUpperCase();
        }

        // Multiple words: first letter of first and last word
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }

    /**
     * Generate a consistent color for a name
     * Uses a simple hash to ensure same name always gets same color
     * @param {string} name - Name to generate color for
     * @returns {string} - Hex color code
     */
    function generateColor(name) {
        if (!name || typeof name !== 'string') {
            return AVATAR_COLORS[0];
        }

        // Simple string hash
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = ((hash << 5) - hash) + name.charCodeAt(i);
            hash = hash & hash; // Convert to 32-bit integer
        }

        const index = Math.abs(hash) % AVATAR_COLORS.length;
        return AVATAR_COLORS[index];
    }

    /**
     * Get contrasting text color (white or black) for a background
     * @param {string} hexColor - Background hex color
     * @returns {string} - '#FFFFFF' or '#000000'
     */
    function getContrastColor(hexColor) {
        // Convert hex to RGB
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    /**
     * Compress and resize an image file to a data URL
     * @param {File} file - Image file to compress
     * @returns {Promise<string>} - Compressed image as base64 data URL
     */
    function compressImage(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                reject(new Error('Invalid image file'));
                return;
            }

            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    // Create canvas for resizing
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Calculate dimensions maintaining aspect ratio
                    let width = img.width;
                    let height = img.height;
                    const maxSize = AVATAR_SIZE;

                    if (width > height) {
                        if (width > maxSize) {
                            height = Math.round(height * maxSize / width);
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = Math.round(width * maxSize / height);
                            height = maxSize;
                        }
                    }

                    // Set canvas size to create square crop
                    const size = Math.min(width, height);
                    canvas.width = maxSize;
                    canvas.height = maxSize;

                    // Calculate crop position (center crop)
                    const sourceSize = Math.min(img.width, img.height);
                    const sourceX = (img.width - sourceSize) / 2;
                    const sourceY = (img.height - sourceSize) / 2;

                    // Draw image with center crop
                    ctx.drawImage(
                        img,
                        sourceX, sourceY, sourceSize, sourceSize,  // Source crop
                        0, 0, maxSize, maxSize                      // Destination
                    );

                    // Convert to JPEG for smaller file size
                    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
                    resolve(dataUrl);
                };

                img.onerror = () => {
                    reject(new Error('Failed to load image'));
                };

                img.src = e.target.result;
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsDataURL(file);
        });
    }

    /**
     * Create a complete avatar object from name and optional photo
     * @param {string} name - Member name
     * @param {string|null} photoUrl - Optional photo data URL
     * @returns {object} - Avatar object { type, photoUrl, initials, color }
     */
    function createAvatar(name, photoUrl = null) {
        const initials = generateInitials(name);
        const color = generateColor(name);

        return {
            type: photoUrl ? 'photo' : 'initials',
            photoUrl: photoUrl || null,
            initials: initials,
            color: color
        };
    }

    /**
     * Render avatar HTML
     * @param {object} avatar - Avatar object
     * @param {string} size - Size class ('sm', 'md', 'lg')
     * @returns {string} - HTML string
     */
    function renderAvatar(avatar, size = 'md') {
        const sizeClass = `avatar--${size}`;

        if (avatar.type === 'photo' && avatar.photoUrl) {
            return `
                <div class="avatar ${sizeClass}">
                    <img src="${avatar.photoUrl}" alt="Avatar" class="avatar__img">
                </div>
            `;
        }

        const textColor = getContrastColor(avatar.color);
        return `
            <div class="avatar ${sizeClass}" style="background-color: ${avatar.color}">
                <span class="avatar__initials" style="color: ${textColor}">${avatar.initials}</span>
            </div>
        `;
    }

    /**
     * Create avatar HTML element (for direct DOM manipulation)
     * @param {object} avatar - Avatar object
     * @param {string} size - Size class ('sm', 'md', 'lg')
     * @returns {HTMLElement} - Avatar DOM element
     */
    function createAvatarElement(avatar, size = 'md') {
        const div = document.createElement('div');
        div.className = `avatar avatar--${size}`;

        if (avatar.type === 'photo' && avatar.photoUrl) {
            const img = document.createElement('img');
            img.src = avatar.photoUrl;
            img.alt = 'Avatar';
            img.className = 'avatar__img';
            div.appendChild(img);
        } else {
            div.style.backgroundColor = avatar.color;
            const span = document.createElement('span');
            span.className = 'avatar__initials';
            span.style.color = getContrastColor(avatar.color);
            span.textContent = avatar.initials;
            div.appendChild(span);
        }

        return div;
    }

    /**
     * Validate image file before processing
     * @param {File} file - File to validate
     * @returns {object} - { valid: boolean, error: string|null }
     */
    function validateImageFile(file) {
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        if (!file) {
            return { valid: false, error: 'No file provided' };
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return { valid: false, error: 'File must be an image (JPEG, PNG, GIF, or WebP)' };
        }

        if (file.size > MAX_SIZE) {
            return { valid: false, error: 'Image must be less than 10MB' };
        }

        return { valid: true, error: null };
    }

    // Public API
    return {
        AVATAR_COLORS,
        generateInitials,
        generateColor,
        getContrastColor,
        compressImage,
        createAvatar,
        renderAvatar,
        createAvatarElement,
        validateImageFile
    };
})();
