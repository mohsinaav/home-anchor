/**
 * Modal Component
 * Reusable modal dialog system
 */

const Modal = (function() {
    let currentModal = null;
    let onConfirmCallback = null;
    let onCancelCallback = null;
    let cleanupTimeoutId = null;

    // DOM elements
    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('modal');
    const titleEl = document.getElementById('modalTitle');
    const contentEl = document.getElementById('modalContent');
    const footerEl = document.getElementById('modalFooter');
    const closeBtn = document.getElementById('modalClose');

    /**
     * Initialize modal events
     */
    function init() {
        if (!overlay) return;

        // Close button
        closeBtn?.addEventListener('click', close);

        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                close();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen()) {
                close();
            }
        });
    }

    /**
     * Check if modal is open
     */
    function isOpen() {
        return overlay?.classList.contains('modal-overlay--active');
    }

    /**
     * Open modal with options
     */
    function open(options = {}) {
        // Cancel any pending cleanup from a previous close
        if (cleanupTimeoutId) {
            clearTimeout(cleanupTimeoutId);
            cleanupTimeoutId = null;
        }

        const {
            title = 'Modal',
            content = '',
            footer = null,
            onConfirm = null,
            onCancel = null,
            size = 'default', // 'small', 'default', 'large'
            showClose = true
        } = options;

        currentModal = options;
        onConfirmCallback = onConfirm;
        onCancelCallback = onCancel;

        // Set title
        if (titleEl) {
            titleEl.textContent = title;
        }

        // Set content
        if (contentEl) {
            if (typeof content === 'string') {
                contentEl.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                contentEl.innerHTML = '';
                contentEl.appendChild(content);
            }
        }

        // Set footer
        if (footerEl) {
            if (footer === null) {
                footerEl.style.display = 'none';
            } else if (typeof footer === 'string') {
                footerEl.style.display = 'flex';
                footerEl.innerHTML = footer;
            } else if (footer instanceof HTMLElement) {
                footerEl.style.display = 'flex';
                footerEl.innerHTML = '';
                footerEl.appendChild(footer);
            }
        }

        // Show/hide close button
        if (closeBtn) {
            closeBtn.style.display = showClose ? 'flex' : 'none';
        }

        // Apply size
        modal?.classList.remove('modal--small', 'modal--large');
        if (size === 'small') {
            modal?.classList.add('modal--small');
        } else if (size === 'large') {
            modal?.classList.add('modal--large');
        }

        // Show modal
        overlay?.classList.add('modal-overlay--active');
        document.body.style.overflow = 'hidden';

        // Focus first input if present
        setTimeout(() => {
            const firstInput = contentEl?.querySelector('input, textarea, select');
            firstInput?.focus();
        }, 100);
    }

    /**
     * Close modal
     */
    function close() {
        overlay?.classList.remove('modal-overlay--active');
        document.body.style.overflow = '';

        if (onCancelCallback) {
            onCancelCallback();
        }

        // Clear after animation (save timeout ID so it can be cancelled)
        cleanupTimeoutId = setTimeout(() => {
            if (contentEl) contentEl.innerHTML = '';
            if (footerEl) footerEl.innerHTML = '';
            currentModal = null;
            onConfirmCallback = null;
            onCancelCallback = null;
            cleanupTimeoutId = null;
        }, 200);
    }

    /**
     * Confirm modal (triggers onConfirm callback)
     */
    function confirm(data) {
        if (onConfirmCallback) {
            onConfirmCallback(data);
        }
        overlay?.classList.remove('modal-overlay--active');
        document.body.style.overflow = '';

        // Clear after animation (save timeout ID so it can be cancelled)
        cleanupTimeoutId = setTimeout(() => {
            if (contentEl) contentEl.innerHTML = '';
            if (footerEl) footerEl.innerHTML = '';
            currentModal = null;
            onConfirmCallback = null;
            onCancelCallback = null;
            cleanupTimeoutId = null;
        }, 200);
    }

    /**
     * Show a simple alert modal
     */
    function alert(message, title = 'Alert') {
        return new Promise((resolve) => {
            open({
                title,
                content: `<p>${message}</p>`,
                footer: `<button class="btn btn--primary" id="modalAlertOk">OK</button>`,
                onConfirm: resolve,
                onCancel: resolve
            });

            document.getElementById('modalAlertOk')?.addEventListener('click', () => {
                confirm();
            });
        });
    }

    /**
     * Show a confirm modal
     */
    function confirmDialog(message, title = 'Confirm') {
        return new Promise((resolve) => {
            open({
                title,
                content: `<p>${message}</p>`,
                footer: `
                    <button class="btn btn--secondary" id="modalConfirmCancel">Cancel</button>
                    <button class="btn btn--primary" id="modalConfirmOk">Confirm</button>
                `,
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false)
            });

            document.getElementById('modalConfirmCancel')?.addEventListener('click', () => {
                close();
            });

            document.getElementById('modalConfirmOk')?.addEventListener('click', () => {
                confirm();
            });
        });
    }

    /**
     * Show a danger confirm modal (for destructive actions)
     */
    function dangerConfirm(message, title = 'Are you sure?') {
        return new Promise((resolve) => {
            open({
                title,
                content: `<p>${message}</p>`,
                footer: `
                    <button class="btn btn--secondary" id="modalDangerCancel">Cancel</button>
                    <button class="btn btn--danger" id="modalDangerConfirm">Delete</button>
                `,
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false)
            });

            document.getElementById('modalDangerCancel')?.addEventListener('click', () => {
                close();
            });

            document.getElementById('modalDangerConfirm')?.addEventListener('click', () => {
                confirm();
            });
        });
    }

    /**
     * Show a prompt modal
     */
    function prompt(message, defaultValue = '', title = 'Input') {
        return new Promise((resolve) => {
            open({
                title,
                content: `
                    <div class="form-group">
                        <label class="form-label">${message}</label>
                        <input type="text" class="form-input" id="modalPromptInput" value="${defaultValue}">
                    </div>
                `,
                footer: `
                    <button class="btn btn--secondary" id="modalPromptCancel">Cancel</button>
                    <button class="btn btn--primary" id="modalPromptOk">OK</button>
                `,
                onCancel: () => resolve(null)
            });

            const input = document.getElementById('modalPromptInput');

            document.getElementById('modalPromptCancel')?.addEventListener('click', () => {
                close();
            });

            document.getElementById('modalPromptOk')?.addEventListener('click', () => {
                const value = input?.value || '';
                confirm(value);
                resolve(value);
            });

            // Enter key submits
            input?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const value = input.value || '';
                    confirm(value);
                    resolve(value);
                }
            });
        });
    }

    /**
     * Create standard footer buttons
     */
    function createFooter(cancelText = 'Cancel', confirmText = 'Save', confirmClass = 'btn--primary') {
        return `
            <button class="btn btn--secondary" data-modal-cancel>${cancelText}</button>
            <button class="btn ${confirmClass}" data-modal-confirm>${confirmText}</button>
        `;
    }

    /**
     * Bind footer button events
     */
    function bindFooterEvents(onConfirmFn) {
        footerEl?.querySelector('[data-modal-cancel]')?.addEventListener('click', close);
        footerEl?.querySelector('[data-modal-confirm]')?.addEventListener('click', () => {
            if (onConfirmFn) {
                const result = onConfirmFn();
                if (result !== false) {
                    close();
                }
            } else {
                confirm();
            }
        });
    }

    // Public API
    return {
        init,
        open,
        close,
        confirm,
        isOpen,
        alert,
        confirm: confirmDialog,
        dangerConfirm,
        prompt,
        createFooter,
        bindFooterEvents
    };
})();
