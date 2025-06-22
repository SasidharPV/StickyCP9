// Sync Module for StickyCP9
// Handles syncing notes with cloud providers (Google Drive, OneDrive)

class SyncManager {
    constructor() {
        this.isInitialized = false;
        this.lastSyncTime = localStorage.getItem('sticky-cp9-last-sync-time') || null;
        this.developmentMode = config.developmentMode || false;
        
        // Listen for auth state changes
        document.addEventListener('authStateChanged', this.handleAuthChange.bind(this));
        
        // In development mode, automatically initialize
        if (this.developmentMode) {
            this.isInitialized = true;
            console.log('Development mode: Sync manager initialized with simulated cloud sync');
        }
    }
    
    // Handle authentication state changes
    handleAuthChange(event) {
        const { isAuthenticated, provider } = event.detail;
        
        if (isAuthenticated && provider) {
            this.initialize(provider);
        } else {
            this.isInitialized = false;
        }
    }
    
    // Initialize sync for provider
    async initialize(provider) {
        if (provider === 'google') {
            await this.initializeGoogleDrive();
        } else if (provider === 'microsoft') {
            await this.initializeOneDrive();
        }
    }
    
    // Initialize Google Drive API
    async initializeGoogleDrive() {
        try {
            // Load Drive API
            await gapi.client.load('drive', 'v3');
            this.isInitialized = true;
            console.log('Google Drive API initialized');
            return true;
        } catch (error) {
            console.error('Error initializing Google Drive API', error);
            return false;
        }
    }
    
    // Initialize OneDrive API
    async initializeOneDrive() {
        // OneDrive API is accessed directly through fetch with the auth token
        this.isInitialized = true;
        console.log('OneDrive API initialized');
        return true;
    }
      // Sync notes to cloud
    async syncNotes(notes) {
        if (!authManager.isAuthenticated || !this.isInitialized) {
            throw new Error('Not authenticated or sync not initialized');
        }
        
        // Check if in development mode
        if (this.developmentMode) {
            console.log('Development mode: Simulating cloud sync');
            
            // Simulate some delay to make it feel real
            await new Promise(resolve => setTimeout(resolve, 800));
            
            this.lastSyncTime = new Date().toISOString();
            localStorage.setItem('sticky-cp9-last-sync-time', this.lastSyncTime);
            
            return {
                success: true,
                provider: authManager.provider,
                timestamp: this.lastSyncTime
            };
        }
        
        try {
            if (authManager.provider === 'google') {
                await this.syncToGoogleDrive(notes);
            } else if (authManager.provider === 'microsoft') {
                await this.syncToOneDrive(notes);
            }
            
            this.lastSyncTime = new Date().toISOString();
            localStorage.setItem('sticky-cp9-last-sync-time', this.lastSyncTime);
            
            return {
                success: true,
                provider: authManager.provider,
                timestamp: this.lastSyncTime
            };
        } catch (error) {
            console.error(`Error syncing notes to ${authManager.provider}`, error);
            throw error;
        }
    }
    
    // Sync notes to Google Drive
    async syncToGoogleDrive(notes) {
        try {
            // Check if app folder exists, create if not
            let folderId = await this.getGoogleDriveFolder();
            
            // Prepare notes file content
            const fileContent = JSON.stringify(notes);
            const fileMetadata = {
                name: 'sticky-cp9-notes.json',
                mimeType: 'application/json',
                parents: folderId ? [folderId] : ['appDataFolder']
            };
            
            // Check if file exists
            const existingFile = await this.getGoogleDriveFile('sticky-cp9-notes.json');
            
            if (existingFile) {
                // Update existing file
                await gapi.client.drive.files.update({
                    fileId: existingFile.id,
                    media: {
                        mimeType: 'application/json',
                        body: fileContent
                    }
                });
                console.log('Notes updated in Google Drive');
            } else {
                // Create new file
                const boundary = '-------314159265358979323846';
                const delimiter = "\\r\\n--" + boundary + "\\r\\n";
                const close_delim = "\\r\\n--" + boundary + "--";
                
                const multipartRequestBody =
                    delimiter +
                    'Content-Type: application/json\\r\\n\\r\\n' +
                    JSON.stringify(fileMetadata) +
                    delimiter +
                    'Content-Type: application/json\\r\\n\\r\\n' +
                    fileContent +
                    close_delim;
                
                await gapi.client.request({
                    'path': '/upload/drive/v3/files',
                    'method': 'POST',
                    'params': {'uploadType': 'multipart'},
                    'headers': {
                        'Content-Type': 'multipart/related; boundary="' + boundary + '"'
                    },
                    'body': multipartRequestBody
                });
                console.log('Notes created in Google Drive');
            }
            
            return true;
        } catch (error) {
            console.error('Error syncing to Google Drive', error);
            throw error;
        }
    }
    
    // Get Google Drive app folder
    async getGoogleDriveFolder() {
        try {
            // Check if 'StickyCP9' folder exists
            const response = await gapi.client.drive.files.list({
                q: "name='StickyCP9' and mimeType='application/vnd.google-apps.folder' and trashed=false",
                spaces: 'drive',
                fields: 'files(id, name)'
            });
            
            const folders = response.result.files;
            if (folders && folders.length > 0) {
                return folders[0].id;
            }
            
            // Create folder if not exists
            const fileMetadata = {
                name: 'StickyCP9',
                mimeType: 'application/vnd.google-apps.folder'
            };
            
            const folderResponse = await gapi.client.drive.files.create({
                resource: fileMetadata,
                fields: 'id'
            });
            
            return folderResponse.result.id;
        } catch (error) {
            console.error('Error getting/creating Google Drive folder', error);
            return null;
        }
    }
    
    // Get Google Drive file
    async getGoogleDriveFile(fileName) {
        try {
            const response = await gapi.client.drive.files.list({
                q: `name='${fileName}' and trashed=false`,
                spaces: 'drive,appDataFolder',
                fields: 'files(id, name, modifiedTime)'
            });
            
            const files = response.result.files;
            if (files && files.length > 0) {
                return files[0];
            }
            
            return null;
        } catch (error) {
            console.error('Error getting Google Drive file', error);
            return null;
        }
    }
    
    // Sync notes to OneDrive
    async syncToOneDrive(notes) {
        try {
            // Prepare notes file content
            const fileContent = JSON.stringify(notes);
            
            // Check if StickyCP9 folder exists in app folder
            let folderId = await this.getOneDriveFolder();
            
            // Check if file exists
            const existingFile = await this.getOneDriveFile('sticky-cp9-notes.json', folderId);
            
            if (existingFile) {
                // Update existing file
                await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${existingFile.id}/content`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${authManager.authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: fileContent
                });
                console.log('Notes updated in OneDrive');
            } else {
                // Create new file in the app folder
                await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authManager.authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: 'sticky-cp9-notes.json',
                        file: {},
                        '@microsoft.graph.conflictBehavior': 'replace'
                    })
                }).then(response => response.json())
                  .then(async file => {
                      // Upload content
                      await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${file.id}/content`, {
                          method: 'PUT',
                          headers: {
                              'Authorization': `Bearer ${authManager.authToken}`,
                              'Content-Type': 'application/json'
                          },
                          body: fileContent
                      });
                  });
                console.log('Notes created in OneDrive');
            }
            
            return true;
        } catch (error) {
            console.error('Error syncing to OneDrive', error);
            throw error;
        }
    }
    
    // Get OneDrive app folder
    async getOneDriveFolder() {
        try {
            // Check if 'StickyCP9' folder exists in app folder
            const response = await fetch('https://graph.microsoft.com/v1.0/me/drive/special/approot/children?$filter=name eq \'StickyCP9\'', {
                headers: {
                    'Authorization': `Bearer ${authManager.authToken}`
                }
            }).then(res => res.json());
            
            if (response.value && response.value.length > 0) {
                return response.value[0].id;
            }
            
            // Create folder if not exists
            const folderResponse = await fetch('https://graph.microsoft.com/v1.0/me/drive/special/approot/children', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authManager.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'StickyCP9',
                    folder: {},
                    '@microsoft.graph.conflictBehavior': 'rename'
                })
            }).then(res => res.json());
            
            return folderResponse.id;
        } catch (error) {
            console.error('Error getting/creating OneDrive folder', error);
            throw error;
        }
    }
    
    // Get OneDrive file
    async getOneDriveFile(fileName, folderId) {
        try {
            const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children?$filter=name eq '${fileName}'`, {
                headers: {
                    'Authorization': `Bearer ${authManager.authToken}`
                }
            }).then(res => res.json());
            
            if (response.value && response.value.length > 0) {
                return response.value[0];
            }
            
            return null;
        } catch (error) {
            console.error('Error getting OneDrive file', error);
            return null;
        }
    }
      // Load notes from cloud
    async loadNotes() {
        if (!authManager.isAuthenticated || !this.isInitialized) {
            throw new Error('Not authenticated or sync not initialized');
        }
        
        // Check if in development mode
        if (this.developmentMode) {
            console.log('Development mode: Simulating loading notes from cloud');
            
            // Simulate some delay to make it feel real
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // In development mode, just return the local notes
            const savedNotes = localStorage.getItem('sticky-cp9-notes');
            const notes = savedNotes ? JSON.parse(savedNotes) : [];
            
            this.lastSyncTime = new Date().toISOString();
            localStorage.setItem('sticky-cp9-last-sync-time', this.lastSyncTime);
            
            return notes;
        }
        
        try {
            let notes = null;
            
            if (authManager.provider === 'google') {
                notes = await this.loadFromGoogleDrive();
            } else if (authManager.provider === 'microsoft') {
                notes = await this.loadFromOneDrive();
            }
            
            if (notes) {
                this.lastSyncTime = new Date().toISOString();
                localStorage.setItem('sticky-cp9-last-sync-time', this.lastSyncTime);
            }
            
            return notes;
        } catch (error) {
            console.error(`Error loading notes from ${authManager.provider}`, error);
            throw error;
        }
    }
    
    // Load notes from Google Drive
    async loadFromGoogleDrive() {
        try {
            const file = await this.getGoogleDriveFile('sticky-cp9-notes.json');
            if (!file) {
                return null;
            }
            
            const response = await gapi.client.drive.files.get({
                fileId: file.id,
                alt: 'media'
            });
            
            return JSON.parse(response.body);
        } catch (error) {
            console.error('Error loading notes from Google Drive', error);
            return null;
        }
    }
    
    // Load notes from OneDrive
    async loadFromOneDrive() {
        try {
            const folderId = await this.getOneDriveFolder();
            const file = await this.getOneDriveFile('sticky-cp9-notes.json', folderId);
            
            if (!file) {
                return null;
            }
            
            const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${file.id}/content`, {
                headers: {
                    'Authorization': `Bearer ${authManager.authToken}`
                }
            }).then(res => res.json());
            
            return response;
        } catch (error) {
            console.error('Error loading notes from OneDrive', error);
            return null;
        }
    }
}

// Create global sync manager instance
const syncManager = new SyncManager();
