/**
 * Export/Import Utilities
 * Data backup and restore functionality
 */

const ExportUtils = (function() {
    /**
     * Export all data to JSON file
     */
    function exportToFile() {
        const data = Storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `home-anchor-backup-${DateUtils.today()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);

        return true;
    }

    /**
     * Import data from JSON file
     */
    function importFromFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }

            if (!file.name.endsWith('.json')) {
                reject(new Error('File must be a JSON file'));
                return;
            }

            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const success = Storage.importData(event.target.result);
                    if (success) {
                        resolve(true);
                    } else {
                        reject(new Error('Invalid data format'));
                    }
                } catch (error) {
                    reject(new Error('Failed to parse file'));
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Export data as a shareable URL (for small datasets)
     */
    function exportToUrl() {
        const data = Storage.exportData();
        const compressed = btoa(encodeURIComponent(data));

        // Check if too long for URL
        if (compressed.length > 2000) {
            return null; // Too large for URL sharing
        }

        const url = new URL(window.location.href);
        url.searchParams.set('data', compressed);
        return url.toString();
    }

    /**
     * Import data from URL parameter
     */
    function importFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const data = params.get('data');

        if (!data) return false;

        try {
            const decompressed = decodeURIComponent(atob(data));
            return Storage.importData(decompressed);
        } catch (error) {
            console.error('Failed to import from URL:', error);
            return false;
        }
    }

    return {
        exportToFile,
        importFromFile,
        exportToUrl,
        importFromUrl
    };
})();
