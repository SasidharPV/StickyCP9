// Note Manager - Handles note CRUD operations
const noteManager = (() => {
    // Create a new note
    function createNote(noteData = {}, notes, saveNotes, renderGroups) {
        const note = {
            id: noteData.id || generateId(),
            title: noteData.title || 'Untitled',
            content: noteData.content || '',
            color: noteData.color || 'yellow',
            groupId: noteData.groupId || 'default', // Default group if none specified
            created: noteData.created || getCurrentDateTime(),
            lastEdited: getCurrentDateTime()
        };
        
        notes.push(note);
        saveNotes();
        renderGroups(); // Render groups which includes rendering notes
        return note;
    }
    
    // Delete a note
    function deleteNote(noteId, notes, saveNotes, renderGroups) {
        const updatedNotes = notes.filter(note => note.id !== noteId);
        return updatedNotes;
    }
    
    // Update a note
    function updateNote(noteId, updates, notes, saveNotes) {
        const noteIndex = notes.findIndex(note => note.id === noteId);
        if (noteIndex !== -1) {
            notes[noteIndex] = { ...notes[noteIndex], ...updates, lastEdited: getCurrentDateTime() };
            saveNotes();
        }
        return notes;
    }
    
    // Copy note content to clipboard
    function copyNoteContent(noteId, notes, showToast) {
        const note = notes.find(note => note.id === noteId);
        if (note) {
            // Make sure we're copying the content, not the title
            const contentToCopy = note.content || '';
            navigator.clipboard.writeText(contentToCopy)
                .then(() => {
                    showToast('Note content copied to clipboard');
                    console.log('Copied content:', contentToCopy);
                })
                .catch(err => {
                    console.error('Failed to copy note content', err);
                    showToast('Failed to copy note content');
                });
        } else {
            console.error('Note not found with ID:', noteId);
        }
    }
    
    // Helper functions
    function generateId() {
        return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    function getCurrentDateTime() {
        const now = new Date();
        return now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    }
    
    // Merge cloud notes with local notes
    function mergeNotes(cloudNotes, notes, saveNotes, renderGroups) {
        // Preserve locally created notes
        const mergedNotes = [...notes];
        
        // Add cloud notes that don't exist locally
        cloudNotes.forEach(cloudNote => {
            const existingIndex = mergedNotes.findIndex(note => note.id === cloudNote.id);
            if (existingIndex === -1) {
                // Note doesn't exist locally, add it
                mergedNotes.push(cloudNote);
            } else {
                // Note exists locally, update with newer info
                // For simplicity, we're assuming cloud is always newer
                // A real app would compare timestamps
                mergedNotes[existingIndex] = cloudNote;
            }
        });
        
        return mergedNotes;
    }
    
    // Load notes from localStorage
    function loadNotes() {
        const savedNotes = localStorage.getItem('sticky-cp9-notes');
        return savedNotes ? JSON.parse(savedNotes) : [];
    }
    
    // Save notes to localStorage
    function saveNotes(notes, authManager, syncManager, appState) {
        localStorage.setItem('sticky-cp9-notes', JSON.stringify(notes));
        
        // Auto-sync to cloud if authenticated and not in offline mode
        if (authManager && authManager.isAuthenticated && syncManager && syncManager.isInitialized && !appState.offlineMode) {
            syncManager.syncNotes(notes)
                .then(() => {
                    console.log(`Notes auto-synced to ${authManager.provider}`);
                })
                .catch(error => {
                    console.error('Auto-sync failed', error);
                });
        }
    }
    
    return {
        createNote,
        deleteNote,
        updateNote,
        copyNoteContent,
        mergeNotes,
        loadNotes,
        saveNotes,
        generateId,
        getCurrentDateTime
    };
})();

// Export the module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = noteManager;
} else {
    window.noteManager = noteManager;
}
