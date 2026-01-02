/**
 * Backup Module
 * Handles automatic local backups using IndexedDB
 * Keeps last 7 days of backups with auto-cleanup
 */
const Backup = (function() {
    'use strict';

    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    const CONFIG = {
        DB_NAME: 'homeAnchor_backups',
        DB_VERSION: 1,
        STORE_NAME: 'backups',
        MAX_BACKUPS: 7,                    // Keep last 7 backups
        MIN_BACKUP_INTERVAL: 60 * 60 * 1000, // Minimum 1 hour between auto-backups
        AUTO_BACKUP_THRESHOLD: 24 * 60 * 60 * 1000 // Auto-backup if last backup > 24 hours
    };

    let db = null;

    // =========================================================================
    // INDEXEDDB SETUP
    // =========================================================================

    /**
     * Initialize IndexedDB for backup storage
     */
    function initDB() {
        return new Promise((resolve, reject) => {
            if (db) {
                resolve(db);
                return;
            }

            const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

            request.onerror = () => {
                console.error('Failed to open backup database:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                db = request.result;
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const database = event.target.result;

                // Create backups store
                if (!database.objectStoreNames.contains(CONFIG.STORE_NAME)) {
                    const store = database.createObjectStore(CONFIG.STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    // =========================================================================
    // BACKUP OPERATIONS
    // =========================================================================

    /**
     * Create a new backup
     * @param {string} trigger - What triggered the backup ('auto', 'manual', 'close')
     * @returns {Promise<object>} The created backup record
     */
    async function createBackup(trigger = 'manual') {
        try {
            await initDB();

            // Get current app data
            const appData = localStorage.getItem('homeAnchor_data');
            if (!appData) {
                console.log('No data to backup');
                return null;
            }

            const backup = {
                timestamp: Date.now(),
                date: new Date().toISOString(),
                trigger: trigger,
                size: appData.length,
                data: appData
            };

            // Save to IndexedDB
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([CONFIG.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(CONFIG.STORE_NAME);
                const request = store.add(backup);

                request.onsuccess = () => {
                    backup.id = request.result;
                    console.log(`Backup created: ${backup.date} (${formatSize(backup.size)})`);

                    // Update last backup timestamp in settings
                    updateLastBackupTime(backup.timestamp);

                    // Cleanup old backups
                    cleanupOldBackups();

                    resolve(backup);
                };

                request.onerror = () => {
                    console.error('Failed to create backup:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Backup creation failed:', error);
            throw error;
        }
    }

    /**
     * Get all backups
     * @returns {Promise<array>} Array of backup records (without data for performance)
     */
    async function getBackupList() {
        try {
            await initDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([CONFIG.STORE_NAME], 'readonly');
                const store = transaction.objectStore(CONFIG.STORE_NAME);
                const index = store.index('timestamp');
                const request = index.openCursor(null, 'prev'); // Newest first

                const backups = [];
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        // Return metadata only (not the full data blob)
                        backups.push({
                            id: cursor.value.id,
                            timestamp: cursor.value.timestamp,
                            date: cursor.value.date,
                            trigger: cursor.value.trigger,
                            size: cursor.value.size
                        });
                        cursor.continue();
                    } else {
                        resolve(backups);
                    }
                };

                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to get backup list:', error);
            return [];
        }
    }

    /**
     * Get a specific backup by ID
     * @param {number} id - Backup ID
     * @returns {Promise<object>} Full backup record with data
     */
    async function getBackup(id) {
        try {
            await initDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([CONFIG.STORE_NAME], 'readonly');
                const store = transaction.objectStore(CONFIG.STORE_NAME);
                const request = store.get(id);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to get backup:', error);
            return null;
        }
    }

    /**
     * Restore from a backup
     * @param {number} id - Backup ID to restore
     * @returns {Promise<boolean>} Success status
     */
    async function restoreBackup(id) {
        try {
            const backup = await getBackup(id);
            if (!backup || !backup.data) {
                throw new Error('Backup not found or empty');
            }

            // Validate the backup data
            const parsed = JSON.parse(backup.data);
            if (!parsed.meta || !parsed.members) {
                throw new Error('Invalid backup data structure');
            }

            // Create a backup of current state before restoring
            await createBackup('pre-restore');

            // Restore the data
            localStorage.setItem('homeAnchor_data', backup.data);

            console.log(`Restored backup from ${backup.date}`);
            return true;
        } catch (error) {
            console.error('Failed to restore backup:', error);
            throw error;
        }
    }

    /**
     * Delete a specific backup
     * @param {number} id - Backup ID
     */
    async function deleteBackup(id) {
        try {
            await initDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([CONFIG.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(CONFIG.STORE_NAME);
                const request = store.delete(id);

                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to delete backup:', error);
            return false;
        }
    }

    /**
     * Remove old backups, keeping only MAX_BACKUPS
     */
    async function cleanupOldBackups() {
        try {
            const backups = await getBackupList();

            if (backups.length > CONFIG.MAX_BACKUPS) {
                // Delete oldest backups beyond the limit
                const toDelete = backups.slice(CONFIG.MAX_BACKUPS);
                for (const backup of toDelete) {
                    await deleteBackup(backup.id);
                    console.log(`Cleaned up old backup: ${backup.date}`);
                }
            }
        } catch (error) {
            console.error('Failed to cleanup old backups:', error);
        }
    }

    // =========================================================================
    // AUTO-BACKUP LOGIC
    // =========================================================================

    /**
     * Check if auto-backup should run and execute if needed
     */
    async function checkAutoBackup() {
        try {
            const settings = getBackupSettings();
            if (!settings.autoBackupEnabled) {
                return;
            }

            const lastBackup = settings.lastBackupTime || 0;
            const timeSinceBackup = Date.now() - lastBackup;

            if (timeSinceBackup >= CONFIG.AUTO_BACKUP_THRESHOLD) {
                console.log('Auto-backup triggered: Last backup was', formatDuration(timeSinceBackup), 'ago');
                await createBackup('auto');
                showBackupNotification('Auto-backup completed');
            }
        } catch (error) {
            console.error('Auto-backup check failed:', error);
        }
    }

    /**
     * Setup backup on page unload (before close)
     */
    function setupCloseBackup() {
        window.addEventListener('beforeunload', () => {
            const settings = getBackupSettings();
            if (settings.backupOnClose) {
                // Use synchronous localStorage for beforeunload
                // IndexedDB may not complete in time
                const appData = localStorage.getItem('homeAnchor_data');
                if (appData) {
                    // Store a pending backup marker
                    localStorage.setItem('homeAnchor_pendingBackup', JSON.stringify({
                        timestamp: Date.now(),
                        data: appData
                    }));
                }
            }
        });
    }

    /**
     * Process any pending backup from previous session
     */
    async function processPendingBackup() {
        try {
            const pending = localStorage.getItem('homeAnchor_pendingBackup');
            if (pending) {
                const { timestamp, data } = JSON.parse(pending);

                // Only process if less than 1 hour old
                if (Date.now() - timestamp < 60 * 60 * 1000) {
                    await initDB();

                    const backup = {
                        timestamp: timestamp,
                        date: new Date(timestamp).toISOString(),
                        trigger: 'close',
                        size: data.length,
                        data: data
                    };

                    return new Promise((resolve) => {
                        const transaction = db.transaction([CONFIG.STORE_NAME], 'readwrite');
                        const store = transaction.objectStore(CONFIG.STORE_NAME);
                        store.add(backup);

                        transaction.oncomplete = () => {
                            console.log('Processed pending backup from previous session');
                            localStorage.removeItem('homeAnchor_pendingBackup');
                            cleanupOldBackups();
                            resolve();
                        };

                        transaction.onerror = () => {
                            localStorage.removeItem('homeAnchor_pendingBackup');
                            resolve();
                        };
                    });
                } else {
                    localStorage.removeItem('homeAnchor_pendingBackup');
                }
            }
        } catch (error) {
            console.error('Failed to process pending backup:', error);
            localStorage.removeItem('homeAnchor_pendingBackup');
        }
    }

    // =========================================================================
    // EXPORT / DOWNLOAD
    // =========================================================================

    /**
     * Download a specific backup as JSON file
     * @param {number} id - Backup ID
     */
    async function downloadBackup(id) {
        try {
            const backup = await getBackup(id);
            if (!backup) {
                throw new Error('Backup not found');
            }

            const filename = `homeanchor-backup-${formatDateForFilename(backup.timestamp)}.json`;
            downloadFile(backup.data, filename, 'application/json');
        } catch (error) {
            console.error('Failed to download backup:', error);
            throw error;
        }
    }

    /**
     * Download all backups as individual files (or could be ZIP)
     */
    async function downloadAllBackups() {
        try {
            const backups = await getBackupList();

            for (const backupMeta of backups) {
                const backup = await getBackup(backupMeta.id);
                if (backup) {
                    const filename = `homeanchor-backup-${formatDateForFilename(backup.timestamp)}.json`;
                    downloadFile(backup.data, filename, 'application/json');

                    // Small delay between downloads
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        } catch (error) {
            console.error('Failed to download all backups:', error);
            throw error;
        }
    }

    /**
     * Download current data as backup file
     */
    function downloadCurrentData() {
        const appData = localStorage.getItem('homeAnchor_data');
        if (!appData) {
            console.error('No data to export');
            return;
        }

        const filename = `homeanchor-export-${formatDateForFilename(Date.now())}.json`;
        downloadFile(appData, filename, 'application/json');
    }

    /**
     * Helper to trigger file download
     */
    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    }

    // =========================================================================
    // SETTINGS MANAGEMENT
    // =========================================================================

    /**
     * Get backup settings
     */
    function getBackupSettings() {
        const defaults = {
            autoBackupEnabled: true,
            backupOnClose: true,
            lastBackupTime: 0
        };

        try {
            const stored = localStorage.getItem('homeAnchor_backupSettings');
            return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
        } catch {
            return defaults;
        }
    }

    /**
     * Save backup settings
     */
    function saveBackupSettings(settings) {
        localStorage.setItem('homeAnchor_backupSettings', JSON.stringify(settings));
    }

    /**
     * Update last backup timestamp
     */
    function updateLastBackupTime(timestamp) {
        const settings = getBackupSettings();
        settings.lastBackupTime = timestamp;
        saveBackupSettings(settings);
    }

    // =========================================================================
    // UI HELPERS
    // =========================================================================

    /**
     * Show a notification about backup status
     */
    function showBackupNotification(message) {
        // Use toast if available
        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show(message, 'success');
        } else {
            console.log('Backup notification:', message);
        }
    }

    /**
     * Format bytes to human readable size
     */
    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    /**
     * Format duration to human readable
     */
    function formatDuration(ms) {
        const hours = Math.floor(ms / (60 * 60 * 1000));
        const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days} day${days > 1 ? 's' : ''}`;
        }
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes} minutes`;
    }

    /**
     * Format timestamp for filename
     */
    function formatDateForFilename(timestamp) {
        const date = new Date(timestamp);
        return date.toISOString().slice(0, 19).replace(/[T:]/g, '-');
    }

    /**
     * Format timestamp for display
     */
    function formatDateForDisplay(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
        const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

        // Today
        if (diffDays === 0) {
            if (diffHours === 0) {
                const diffMins = Math.floor(diffMs / (60 * 1000));
                return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
            }
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        }

        // Yesterday
        if (diffDays === 1) {
            return 'Yesterday at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // Within a week
        if (diffDays < 7) {
            return `${diffDays} days ago`;
        }

        // Older
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }

    /**
     * Get trigger label for display
     */
    function getTriggerLabel(trigger) {
        const labels = {
            'auto': 'Auto',
            'manual': 'Manual',
            'close': 'On Close',
            'pre-restore': 'Pre-Restore'
        };
        return labels[trigger] || trigger;
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    async function init() {
        try {
            // Initialize database
            await initDB();

            // Process any pending backup from last session
            await processPendingBackup();

            // Setup close backup handler
            setupCloseBackup();

            // Check if auto-backup is needed
            await checkAutoBackup();

            console.log('Backup module initialized');
        } catch (error) {
            console.error('Backup module initialization failed:', error);
        }
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    return {
        init,
        createBackup,
        getBackupList,
        getBackup,
        restoreBackup,
        deleteBackup,
        downloadBackup,
        downloadAllBackups,
        downloadCurrentData,
        getBackupSettings,
        saveBackupSettings,
        checkAutoBackup,
        // Helpers
        formatSize,
        formatDateForDisplay,
        getTriggerLabel
    };
})();
