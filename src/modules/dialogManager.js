// Dialog Manager - Handles dialogs and modals
const dialogManager = (() => {
    // User profile dialog
    function showUserProfileDialog(authManager, uiManager) {
        if (!authManager.isAuthenticated) {
            uiManager.showToast('You are not signed in');
            return;
        }
        
        const profile = authManager.userProfile;
        if (!profile) return;
        
        const dialog = document.createElement('div');
        dialog.className = 'dialog-overlay';
        
        dialog.innerHTML = `
            <div class="dialog">
                <div class="dialog-header">
                    <h3>User Profile</h3>
                    <button class="close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="dialog-body user-profile-dialog">
                    <div class="user-avatar-large">
                        <img src="${profile.imageUrl}" alt="${profile.name}" />
                    </div>
                    <div class="user-info">
                        <div class="user-name">${profile.name}</div>
                        <div class="user-email">${profile.email}</div>
                        <div class="user-provider">Signed in with ${authManager.provider === 'google' ? 'Google' : 'Microsoft'}</div>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn danger sign-out-btn">Sign Out</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Add event listeners to close button
        const closeBtn = dialog.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
        
        // Add event listeners to sign out button
        const signOutBtn = dialog.querySelector('.sign-out-btn');
        signOutBtn.addEventListener('click', () => {
            authManager.signOut();
            document.body.removeChild(dialog);
        });
    }
    
    // Sync dialog
    function showSyncDialog(authManager, syncManager, notes, uiManager) {
        const dialog = document.createElement('div');
        dialog.className = 'dialog-overlay';
        
        dialog.innerHTML = `
            <div class="dialog">
                <div class="dialog-header">
                    <h3>Sync Notes</h3>
                    <button class="close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="dialog-body">
                    ${authManager.isAuthenticated ? `
                        <p>Your notes are currently synced with ${authManager.provider === 'google' ? 'Google Drive' : 'OneDrive'}.</p>
                        <button class="btn primary sync-now-btn">Sync Now</button>
                    ` : `
                        <p>Sign in to sync your notes to the cloud.</p>
                        <div class="cloud-providers">
                            <button class="cloud-provider google-provider">
                                <i class="fab fa-google"></i>
                                <span>Google Drive</span>
                            </button>
                            <button class="cloud-provider microsoft-provider">
                                <i class="fab fa-microsoft"></i>
                                <span>Microsoft OneDrive</span>
                            </button>
                        </div>
                    `}
                </div>
                <div class="dialog-footer">
                    <button class="btn secondary cancel-btn">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Add event listeners to close button
        const closeBtn = dialog.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
        
        // Add event listeners to cancel button
        const cancelBtn = dialog.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
        
        // Add event listeners to cloud providers
        if (!authManager.isAuthenticated) {
            const googleProvider = dialog.querySelector('.google-provider');
            googleProvider.addEventListener('click', () => {
                authManager.signInWithGoogle();
                document.body.removeChild(dialog);
            });
            
            const microsoftProvider = dialog.querySelector('.microsoft-provider');
            microsoftProvider.addEventListener('click', () => {
                authManager.signInWithMicrosoft();
                document.body.removeChild(dialog);
            });
        } else {
            // Add event listener for sync now button
            const syncNowBtn = dialog.querySelector('.sync-now-btn');
            if (syncNowBtn) {
                syncNowBtn.addEventListener('click', () => {
                    syncManager.syncNotes(notes)
                        .then(() => {
                            uiManager.showToast(`Notes synced to ${authManager.provider === 'google' ? 'Google Drive' : 'OneDrive'}`);
                            const now = noteManager.getCurrentDateTime();
                            appStateManager.updateSyncStatus(window.appState, true, authManager.provider, now);
                            document.body.removeChild(dialog);
                        })
                        .catch(error => {
                            console.error('Sync failed', error);
                            uiManager.showToast('Failed to sync notes');
                        });
                });
            }
        }
    }
    
    return {
        showUserProfileDialog,
        showSyncDialog
    };
})();

// Export the module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = dialogManager;
} else {
    window.dialogManager = dialogManager;
}
