// Group Manager - Handles group CRUD operations
const groupManager = (() => {
    // Create a new group
    function createGroup(groupData = {}, groups, saveGroups, renderGroups) {
        const group = {
            id: groupData.id || generateId(),
            title: groupData.title || 'New Group',
            order: groupData.order || groups.length
        };
        
        groups.push(group);
        saveGroups();
        renderGroups();
        return group;
    }
    
    // Delete a group and move its notes to the default group
    function deleteGroup(groupId, groups, notes, saveGroups, saveNotes, renderGroups, showToast) {
        // Make sure we're not deleting the default group
        if (groupId === 'default') {
            showToast("Cannot delete the default group.");
            return { groups, notes };
        }
        
        // Move all notes from this group to the default group
        const updatedNotes = notes.map(note => {
            if (note.groupId === groupId) {
                return { ...note, groupId: 'default' };
            }
            return note;
        });
        
        // Remove the group
        const updatedGroups = groups.filter(group => group.id !== groupId);
        
        return { 
            groups: updatedGroups, 
            notes: updatedNotes
        };
    }
    
    // Update a group
    function updateGroup(groupId, updates, groups, saveGroups, renderGroups) {
        const groupIndex = groups.findIndex(group => group.id === groupId);
        if (groupIndex !== -1) {
            groups[groupIndex] = { ...groups[groupIndex], ...updates };
            saveGroups();
            renderGroups();
        }
        return groups;
    }
    
    // Load groups from localStorage
    function loadGroups() {
        const savedGroups = localStorage.getItem('sticky-cp9-groups');
        if (savedGroups) {
            return JSON.parse(savedGroups);
        } else {
            // Create a default group if none exist
            const defaultGroup = {
                id: 'default',
                title: 'My Notes',
                order: 0
            };
            return [defaultGroup];
        }
    }
    
    // Save groups to localStorage
    function saveGroups(groups, authManager, syncManager, appState) {
        localStorage.setItem('sticky-cp9-groups', JSON.stringify(groups));
        
        // Also sync if authenticated
        if (authManager && authManager.isAuthenticated && syncManager && syncManager.isInitialized && !appState.offlineMode) {
            // Note: You would need to extend your syncManager to handle groups
            if (syncManager.syncGroups) {
                syncManager.syncGroups(groups)
                    .then(() => {
                        console.log('Groups auto-synced');
                    })
                    .catch(error => {
                        console.error('Groups sync failed', error);
                    });
            }
        }
    }
    
    // Helper functions
    function generateId() {
        return 'group_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    return {
        createGroup,
        deleteGroup,
        updateGroup,
        loadGroups,
        saveGroups
    };
})();

// Export the module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = groupManager;
} else {
    window.groupManager = groupManager;
}
