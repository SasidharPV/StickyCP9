// App State Manager - Handles application state
const appStateManager = (() => {
    // Initialize state from localStorage
    function initializeState() {
        return {
            theme: localStorage.getItem('sticky-cp9-theme') || 'light',
            synced: false,
            syncProvider: localStorage.getItem('sticky-cp9-sync-provider') || null,
            lastSyncTime: localStorage.getItem('sticky-cp9-last-sync-time') || null,
            offlineMode: localStorage.getItem('sticky-cp9-offline-mode') === 'true',
            draggedNote: null
        };
    }
    
    // Update theme state
    function updateTheme(state, theme) {
        state.theme = theme;
        localStorage.setItem('sticky-cp9-theme', theme);
        return state;
    }
    
    // Toggle offline mode
    function toggleOfflineMode(state, uiManager, authManager, syncManager) {
        state.offlineMode = !state.offlineMode;
        localStorage.setItem('sticky-cp9-offline-mode', state.offlineMode);
        
        if (state.offlineMode) {
            // Switching to offline mode
            uiManager.showToast('Offline mode enabled. Changes will not be synced to cloud.');
            
            // Disable auto-sync
            if (authManager.isAuthenticated) {
                uiManager.showToast('You are still signed in, but changes will not be synced.');
            }
        } else {
            // Switching to online mode
            uiManager.showToast('Online mode enabled.');
            
            // If authenticated, offer to sync notes
            if (authManager.isAuthenticated) {
                uiManager.showConfirmDialog(
                    'Sync Notes',
                    'Do you want to sync your notes with the cloud?',
                    () => {
                        document.getElementById('sync-button').click(); // Trigger sync button click
                    }
                );
            } else {
                uiManager.showToast('Sign in to enable cloud sync.');
            }
        }
        
        return state;
    }
    
    // Update sync status
    function updateSyncStatus(state, isSynced, provider, lastSyncTime) {
        state.synced = isSynced;
        if (provider) state.syncProvider = provider;
        if (lastSyncTime) {
            state.lastSyncTime = lastSyncTime;
            localStorage.setItem('sticky-cp9-last-sync-time', lastSyncTime);
        }
        return state;
    }
    
    return {
        initializeState,
        updateTheme,
        toggleOfflineMode,
        updateSyncStatus
    };
})();

// Export the module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = appStateManager;
} else {
    window.appStateManager = appStateManager;
}
