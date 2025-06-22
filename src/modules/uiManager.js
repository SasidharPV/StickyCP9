// UI Manager - Handles UI rendering and interactions
const uiManager = (() => {
    // Render all groups with their notes
    function renderGroups(groups, notes, groupsContainer, appState, handlers) {
        const { updateGroup, deleteGroup, createNote, createGroup } = handlers;
        
        groupsContainer.innerHTML = '';
        
        // Sort groups by their order
        const sortedGroups = [...groups].sort((a, b) => a.order - b.order);
        
        sortedGroups.forEach(group => {
            const groupElement = document.createElement('div');
            groupElement.className = 'group';
            groupElement.dataset.id = group.id;
            
            groupElement.innerHTML = `
                <div class="group-header">
                    <div class="group-title" contenteditable="true">${group.title}</div>
                    <div class="group-actions">
                        ${group.id !== 'default' ? 
                            `<button class="btn action delete-group-btn" title="Delete Group">
                                <i class="fas fa-trash"></i>
                            </button>` : ''}
                    </div>
                </div>
                <div class="group-notes" data-group-id="${group.id}"></div>
                <button class="btn primary add-note-to-group" data-group-id="${group.id}">
                    <i class="fas fa-plus"></i> Add Note
                </button>
            `;
            
            groupsContainer.appendChild(groupElement);
            
            // Add event listeners to the group
            const groupTitle = groupElement.querySelector('.group-title');
            groupTitle.addEventListener('blur', e => {
                const newTitle = e.target.textContent.trim();
                if (newTitle && newTitle !== group.title) {
                    updateGroup(group.id, { title: newTitle });
                } else {
                    e.target.textContent = group.title;
                }
            });
            
            groupTitle.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
            
            const deleteGroupBtn = groupElement.querySelector('.delete-group-btn');
            if (deleteGroupBtn) {
                deleteGroupBtn.addEventListener('click', () => {
                    showConfirmDialog(
                        'Delete Group', 
                        `Are you sure you want to delete "${group.title}"? All notes will be moved to the default group.`,
                        () => deleteGroup(group.id)
                    );
                });
            }
            
            // Add button to create new notes in this group
            const addNoteBtn = groupElement.querySelector('.add-note-to-group');
            addNoteBtn.addEventListener('click', () => {
                createNote({ groupId: group.id });
            });
            
            // Set up drag and drop for this group
            const notesContainer = groupElement.querySelector('.group-notes');
            
            // When dragging over this group
            notesContainer.addEventListener('dragover', e => {
                e.preventDefault();
                notesContainer.classList.add('drag-over');
            });
            
            // When leaving this group
            notesContainer.addEventListener('dragleave', e => {
                notesContainer.classList.remove('drag-over');
            });
            
            // When dropping a note onto this group
            notesContainer.addEventListener('drop', e => {
                e.preventDefault();
                notesContainer.classList.remove('drag-over');
                
                const noteId = appState.draggedNote;
                if (noteId) {
                    // Move the note to this group
                    const noteIndex = notes.findIndex(note => note.id === noteId);
                    if (noteIndex !== -1) {
                        notes[noteIndex].groupId = group.id;
                        handlers.saveNotes();
                        renderGroups(groups, notes, groupsContainer, appState, handlers); // Re-render all groups
                        showToast(`Note moved to "${group.title}"`);
                        appState.draggedNote = null;
                    }
                }
            });
        });
        
        // Add "Add Group" button
        const addGroupElement = document.createElement('button');
        addGroupElement.className = 'add-group-btn';
        addGroupElement.innerHTML = '<i class="fas fa-plus"></i>';
        addGroupElement.title = 'Add New Group';
        addGroupElement.addEventListener('click', () => {
            createGroup();
        });
        
        groupsContainer.appendChild(addGroupElement);
        
        // Now render all notes
        renderNotes(groups, notes, groupsContainer, handlers);
    }
    
    // Render all notes
    function renderNotes(groups, notes, groupsContainer, handlers) {
        const { deleteNote, copyNoteContent, updateNote } = handlers;
        
        // Clear any existing "empty" classes
        document.querySelectorAll('.group-notes').forEach(container => {
            container.classList.remove('empty');
        });
        
        // Group notes by groupId
        const notesByGroup = {};
        notes.forEach(note => {
            const groupId = note.groupId || 'default';
            if (!notesByGroup[groupId]) {
                notesByGroup[groupId] = [];
            }
            notesByGroup[groupId].push(note);
        });
        
        // Clear all group note containers
        document.querySelectorAll('.group-notes').forEach(container => {
            container.innerHTML = '';
        });
        
        // Add notes to their respective groups
        for (const [groupId, groupNotes] of Object.entries(notesByGroup)) {
            const groupNotesContainer = document.querySelector(`.group-notes[data-group-id="${groupId}"]`);
            
            if (groupNotesContainer) {
                if (groupNotes.length === 0) {
                    groupNotesContainer.classList.add('empty');
                }
                
                groupNotes.forEach(note => {
                    const noteElement = document.createElement('div');
                    noteElement.className = `note ${note.color}`;
                    noteElement.dataset.id = note.id;
                    
                    // Make notes draggable
                    noteElement.draggable = true;
                    
                    noteElement.innerHTML = `
                        <div class="note-header">
                            <div class="note-title" contenteditable="true">${note.title}</div>
                            <div class="note-actions">
                                <button class="btn action color-btn" title="Change color">
                                    <i class="fas fa-palette"></i>
                                </button>
                                <button class="btn action copy-btn" title="Copy content">
                                    <i class="fas fa-copy"></i>
                                </button>
                                <button class="btn action delete-btn" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="color-picker">
                            <div class="color-option yellow" data-color="yellow"></div>
                            <div class="color-option green" data-color="green"></div>
                            <div class="color-option blue" data-color="blue"></div>
                            <div class="color-option purple" data-color="purple"></div>
                            <div class="color-option pink" data-color="pink"></div>
                            <div class="color-option orange" data-color="orange"></div>
                        </div>
                        <textarea class="note-content" placeholder="Write your note here...">${note.content}</textarea>
                        <div class="note-footer">
                            <div>Created: ${note.created}</div>
                            <div>Edited: ${note.lastEdited}</div>
                        </div>
                    `;
                    
                    groupNotesContainer.appendChild(noteElement);
                });
            }
        }
        
        // Add event listeners to note elements
        attachNoteEventListeners(notes, handlers);
    }
    
    function attachNoteEventListeners(notes, handlers) {
        const { deleteNote, copyNoteContent, updateNote } = handlers;
        
        // Delete button event listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const noteId = e.target.closest('.note').dataset.id;
                deleteNote(noteId);
            });
        });
        
        // Copy button event listeners
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const note = e.target.closest('.note');
                if (note) {
                    const noteId = note.dataset.id;
                    // Visual feedback - temporarily change icon to check mark
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                    }, 1000);
                    
                    copyNoteContent(noteId);
                }
            });
        });
        
        // Color button event listeners
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const colorPicker = e.target.closest('.note').querySelector('.color-picker');
                colorPicker.classList.toggle('active');
                
                // Close other color pickers
                document.querySelectorAll('.color-picker.active').forEach(picker => {
                    if (picker !== colorPicker) {
                        picker.classList.remove('active');
                    }
                });
                
                // Stop propagation to prevent closing when clicking on the button itself
                e.stopPropagation();
            });
        });
        
        // Drag and drop event listeners
        document.querySelectorAll('.note').forEach(noteElem => {
            noteElem.addEventListener('dragstart', e => {
                noteElem.classList.add('dragging');
                window.appState.draggedNote = noteElem.dataset.id;
            });
            
            noteElem.addEventListener('dragend', e => {
                noteElem.classList.remove('dragging');
            });
        });
        
        // Color option event listeners
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', e => {
                const noteElement = e.target.closest('.note');
                const noteId = noteElement.dataset.id;
                const color = e.target.dataset.color;
                
                // Update note color
                noteElement.className = `note ${color}`;
                
                // Close color picker
                const colorPicker = noteElement.querySelector('.color-picker');
                colorPicker.classList.remove('active');
                
                // Update in state
                updateNote(noteId, { color });
                
                // Stop propagation
                e.stopPropagation();
            });
        });
        
        // Title edit event listeners
        document.querySelectorAll('.note-title').forEach(title => {
            title.addEventListener('blur', e => {
                const noteId = e.target.closest('.note').dataset.id;
                const newTitle = e.target.textContent.trim();
                if (newTitle) {
                    updateNote(noteId, { title: newTitle });
                }
            });
            
            title.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
        });
        
        // Note content event listeners
        document.querySelectorAll('.note-content').forEach(textarea => {
            textarea.addEventListener('input', function() {
                const noteId = this.closest('.note').dataset.id;
                updateNote(noteId, { content: this.value });
            });
        });
        
        // Click outside to close color pickers
        document.addEventListener('click', e => {
            if (!e.target.closest('.color-btn') && !e.target.closest('.color-picker')) {
                document.querySelectorAll('.color-picker.active').forEach(picker => {
                    picker.classList.remove('active');
                });
            }
        });
    }
    
    // Update offline mode UI based on current state
    function updateOfflineModeUI(appState, offlineToggleBtn, syncBtn) {
        if (appState.offlineMode) {
            offlineToggleBtn.classList.add('active');
            offlineToggleBtn.innerHTML = '<i class="fas fa-plane"></i>';
            offlineToggleBtn.setAttribute('title', 'Offline Mode (On) - Click to Go Online');
            document.querySelector('.app-title').innerHTML = 'StickyCP9 Notes <span class="offline-indicator"><i class="fas fa-plane"></i> Offline</span>';
            
            // Disable sync button in offline mode
            syncBtn.disabled = true;
            syncBtn.classList.add('disabled');
        } else {
            offlineToggleBtn.classList.remove('active');
            offlineToggleBtn.innerHTML = '<i class="fas fa-wifi"></i>';
            offlineToggleBtn.setAttribute('title', 'Online Mode - Click to Go Offline');
            document.querySelector('.app-title').innerHTML = 'StickyCP9 Notes';
            
            // Enable sync button in online mode
            syncBtn.disabled = false;
            syncBtn.classList.remove('disabled');
        }
    }
    
    // Toast notifications
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    // Confirmation dialog
    function showConfirmDialog(title, message, confirmCallback) {
        const dialog = document.createElement('div');
        dialog.className = 'dialog-overlay';
        
        dialog.innerHTML = `
            <div class="dialog">
                <div class="dialog-header">
                    <h3>${title}</h3>
                    <button class="close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="dialog-body">
                    <p>${message}</p>
                </div>
                <div class="dialog-footer">
                    <button class="btn secondary cancel-btn">Cancel</button>
                    <button class="btn primary confirm-btn">Confirm</button>
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
        
        // Add event listeners to confirm button
        const confirmBtn = dialog.querySelector('.confirm-btn');
        confirmBtn.addEventListener('click', () => {
            confirmCallback();
            document.body.removeChild(dialog);
        });
    }
    
    return {
        renderGroups,
        renderNotes,
        attachNoteEventListeners,
        updateOfflineModeUI,
        showToast,
        showConfirmDialog
    };
})();

// Export the module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = uiManager;
} else {
    window.uiManager = uiManager;
}
