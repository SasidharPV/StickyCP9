// StickyCP9 - Modern Sticky Notes with Copy Functionality
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const notesContainer = document.getElementById('notes-container');
    const groupsContainer = document.getElementById('groups-container');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const syncBtn = document.getElementById('sync-button');
    const userProfileBtn = document.getElementById('user-profile');
    const offlineToggleBtn = document.getElementById('offline-toggle');
    
    // Initialize application state
    window.appState = appStateManager.initializeState();
    
    // Load data from localStorage
    let notes = noteManager.loadNotes();
    let groups = groupManager.loadGroups();
    
    // Initialize theme
    if (window.appState.theme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Initialize offline mode indicator
    uiManager.updateOfflineModeUI(window.appState, offlineToggleBtn, syncBtn);
    
    // Set up event handlers
    const handlers = {
        saveNotes: () => noteManager.saveNotes(notes, authManager, syncManager, window.appState),
        saveGroups: () => groupManager.saveGroups(groups, authManager, syncManager, window.appState),
        createNote: noteData => {
            const newNote = noteManager.createNote(noteData, notes, handlers.saveNotes, () => renderAllGroups());
            return newNote;
        },
        deleteNote: noteId => {
            notes = noteManager.deleteNote(noteId, notes, handlers.saveNotes, () => renderAllGroups());
            handlers.saveNotes();
            renderAllGroups();
        },
        updateNote: (noteId, updates) => {
            notes = noteManager.updateNote(noteId, updates, notes, handlers.saveNotes);
            return notes;
        },
        copyNoteContent: noteId => noteManager.copyNoteContent(noteId, notes, uiManager.showToast),
        createGroup: groupData => {
            const newGroup = groupManager.createGroup(groupData, groups, handlers.saveGroups, () => renderAllGroups());
            return newGroup;
        },
        deleteGroup: groupId => {
            const result = groupManager.deleteGroup(
                groupId, 
                groups, 
                notes, 
                handlers.saveGroups, 
                handlers.saveNotes, 
                () => renderAllGroups(),
                uiManager.showToast
            );
            if (result) {
                groups = result.groups;
                notes = result.notes;
                handlers.saveGroups();
                handlers.saveNotes();
                renderAllGroups();
            }
        },
        updateGroup: (groupId, updates) => {
            groups = groupManager.updateGroup(groupId, updates, groups, handlers.saveGroups, () => renderAllGroups());
            return groups;
        }
    };
    
    // Function to render all groups and notes
    function renderAllGroups() {
        uiManager.renderGroups(groups, notes, groupsContainer, window.appState, handlers);
    }
    
    // Listen for authentication state changes
    document.addEventListener('authStateChanged', handleAuthStateChange);
    
    // Listen for offline mode changes
    document.addEventListener('offlineModeChanged', (event) => {
        const { offlineMode } = event.detail;
        window.appState.offlineMode = offlineMode;
        uiManager.updateOfflineModeUI(window.appState, offlineToggleBtn, syncBtn);
    });
    
    function handleAuthStateChange(event) {
        const { isAuthenticated, provider, userProfile } = event.detail;
        
        if (isAuthenticated && provider) {
            // Update UI to show authenticated state
            uiManager.showToast(`Signed in with ${provider === 'google' ? 'Google' : 'Microsoft'}`);
            
            // Try to load notes from cloud
            syncManager.loadNotes()
                .then(cloudNotes => {
                    if (cloudNotes && cloudNotes.length > 0) {
                        // Merge cloud notes with local notes
                        notes = noteManager.mergeNotes(cloudNotes, notes, handlers.saveNotes, renderAllGroups);
                        handlers.saveNotes();
                        renderAllGroups();
                    }
                })
                .catch(error => {
                    console.error('Error loading notes from cloud', error);
                    uiManager.showToast('Failed to load notes from cloud. Using local notes.');
                });
        } else if (event.detail.signedOut) {
            // User signed out
            uiManager.showToast('Signed out successfully');
        }    }
    
    // Theme toggle button
    themeToggleBtn.addEventListener('click', () => {
        if (window.appState.theme === 'light') {
            window.appState = appStateManager.updateTheme(window.appState, 'dark');
            document.body.classList.add('dark-theme');
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            window.appState = appStateManager.updateTheme(window.appState, 'light');
            document.body.classList.remove('dark-theme');
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });    // User profile button
    if (userProfileBtn) {
        userProfileBtn.addEventListener('click', () => {
            dialogManager.showUserProfileDialog(authManager, uiManager);
        });
    }
    
    // Cloud sync button
    syncBtn.addEventListener('click', () => {
        dialogManager.showSyncDialog(authManager, syncManager, notes, uiManager);
    });
    
    // Offline mode toggle functionality
    offlineToggleBtn.addEventListener('click', () => {
        window.appState = appStateManager.toggleOfflineMode(
            window.appState, 
            uiManager, 
            authManager, 
            syncManager
        );
        uiManager.updateOfflineModeUI(window.appState, offlineToggleBtn, syncBtn);
    });
    
    // Initialize by rendering groups (which includes notes)
    renderAllGroups();
    
    // Create a default note if there are none
    if (notes.length === 0) {
        handlers.createNote({
            title: 'Welcome to StickyCP9!',
            content: 'This is your first note. You can edit this text, change the title above, and even change the color using the palette button.\n\nTo copy the content of any note, click the copy button in the top-right corner.\n\nUse the moon icon to toggle between light and dark themes. Use the cloud icon to sync your notes to Google Drive or OneDrive.\n\nTry creating different groups and dragging notes between them!\n\nClick the + button to create a new note.',
            color: 'yellow',
            groupId: 'default'
        });
    }
});
