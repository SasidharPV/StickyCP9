// Sync Module for StickyCP9
// Handles syncing notes with cloud providers (Google Drive, OneDrive)

class SyncManager {
    constructor() {
        this.isInitialized = false;
        this.lastSyncTime = localStorage.getItem('sticky-cp9-last-sync-time') || null;
        this.developmentMode = config.developmentMode || false;
        this.FILE_NAME = 'sticky-cp9-notes.json';
        this.GROUP_FILE_NAME = 'sticky-cp9-groups.json';
        
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
        if (this.developmentMode) {
            this.isInitialized = true;
            return true;
        }
        
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
        if (this.developmentMode) {
            this.isInitialized = true;
            return true;
        }
        
        try {
            // OneDrive is initialized through the auth process
            this.isInitialized = true;
            console.log('Microsoft OneDrive API initialized');
            return true;
        } catch (error) {
            console.error('Error initializing OneDrive API', error);
            return false;
        }
    }
    
    // Save notes to cloud storage
    async syncNotes(notes) {
        if (!this.isInitialized) {
            throw new Error('Sync manager not initialized');
        }
        
        if (this.developmentMode) {
            // Simulate cloud sync
            return this.simulateCloudSync(notes);
        }
        
        // Select provider
        if (authManager.provider === 'google') {
            return this.syncToGoogleDrive(notes);
        } else if (authManager.provider === 'microsoft') {
            return this.syncToOneDrive(notes);
        } else {
            throw new Error('Unknown provider');
        }
    }
    
    // Sync groups to cloud storage
    async syncGroups(groups) {
        if (!this.isInitialized) {
            throw new Error('Sync manager not initialized');
        }
        
        if (this.developmentMode) {
            // Simulate cloud sync
            return this.simulateGroupSync(groups);
        }
        
        // Select provider
        if (authManager.provider === 'google') {
            return this.syncGroupsToGoogleDrive(groups);
        } else if (authManager.provider === 'microsoft') {
            return this.syncGroupsToOneDrive(groups);
        } else {
            throw new Error('Unknown provider');
        }
    }
    
    // Simulate cloud sync for development mode
    simulateCloudSync(notes) {
        console.log('Development mode: Simulating cloud sync');
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                this.lastSyncTime = new Date().toISOString();
                localStorage.setItem('sticky-cp9-last-sync-time', this.lastSyncTime);
                console.log('Development mode: Cloud sync simulated successfully');
                resolve({ success: true });
            }, 500);
        });
    }
    
    // Simulate group sync for development mode
    simulateGroupSync(groups) {
        console.log('Development mode: Simulating group sync');
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve({ success: true });
            }, 500);
        });
    }
      // Sync notes to Google Drive
    async syncToGoogleDrive(notes) {
        try {
            // Create a blob from the JSON data
            const fileContent = JSON.stringify(notes);
            const blob = new Blob([fileContent], {type: 'application/json'});
            
            // Find or create the file
            const file = await this.findOrCreateFile(this.FILE_NAME);
            
            // Check if the Google API client is loaded and initialized
            if (!gapi.client.getToken()) {
                throw new Error('Google API client not authenticated');
            }
            
            // Use the Google Drive API v3 to upload the file
            // We'll use the resumable upload protocol for better reliability
            const metadata = {
                name: this.FILE_NAME,
                mimeType: 'application/json'
            };
            
            // Create a form data object for uploading
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
            form.append('file', blob);
            
            // Use fetch API for the upload
            const uploadResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${file.id}?uploadType=multipart`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${gapi.auth.getToken().access_token}`
                },
                body: form
            });
            
            if (!uploadResponse.ok) {
                throw new Error(`Google Drive upload failed with status: ${uploadResponse.status}`);
            }
            
            this.lastSyncTime = new Date().toISOString();
            localStorage.setItem('sticky-cp9-last-sync-time', this.lastSyncTime);
            
            console.log('Notes synced to Google Drive successfully');
            return { success: true, timestamp: this.lastSyncTime };
            
        } catch (error) {
            console.error('Error syncing to Google Drive', error);
            throw error;
        }
    }
      // Sync groups to Google Drive
    async syncGroupsToGoogleDrive(groups) {
        try {
            // Create a blob from the JSON data
            const fileContent = JSON.stringify(groups);
            const blob = new Blob([fileContent], {type: 'application/json'});
            
            // Find or create the file
            const file = await this.findOrCreateFile(this.GROUP_FILE_NAME);
            
            // Check if the Google API client is loaded and initialized
            if (!gapi.client.getToken()) {
                throw new Error('Google API client not authenticated');
            }
            
            // Use the Google Drive API v3 to upload the file
            const metadata = {
                name: this.GROUP_FILE_NAME,
                mimeType: 'application/json'
            };
            
            // Create a form data object for uploading
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
            form.append('file', blob);
            
            // Use fetch API for the upload
            const uploadResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${file.id}?uploadType=multipart`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${gapi.auth.getToken().access_token}`
                },
                body: form
            });
            
            if (!uploadResponse.ok) {
                throw new Error(`Google Drive group upload failed with status: ${uploadResponse.status}`);
            }
            
            console.log('Groups synced to Google Drive successfully');
            return { success: true };
            
        } catch (error) {
            console.error('Error syncing groups to Google Drive', error);
            throw error;
        }
    }
      // Find or create a file in Google Drive
    async findOrCreateFile(fileName) {
        try {
            // Check if the Google API client is loaded and initialized
            if (!gapi.client.getToken()) {
                throw new Error('Google API client not authenticated');
            }
            
            // Search for file in App Data folder first (preferred location)
            try {
                const appDataResponse = await gapi.client.drive.files.list({
                    q: `name='${fileName}' and trashed=false and spaces='appDataFolder'`,
                    fields: 'files(id, name)',
                    spaces: 'appDataFolder'
                });
                
                const appDataFiles = appDataResponse.result.files;
                
                if (appDataFiles && appDataFiles.length > 0) {
                    console.log(`Found file '${fileName}' in App Data folder`);
                    return appDataFiles[0];
                }
            } catch (appDataError) {
                console.warn('Error searching App Data folder, falling back to regular search', appDataError);
            }
            
            // Search for file in My Drive
            const response = await gapi.client.drive.files.list({
                q: `name='${fileName}' and trashed=false`,
                fields: 'files(id, name)'
            });
            
            const files = response.result.files;
            
            if (files && files.length > 0) {
                console.log(`Found file '${fileName}' in My Drive`);
                return files[0];
            }
            
            // Create new file if not found (prefer App Data folder for privacy)
            const fileMetadata = {
                name: fileName,
                mimeType: 'application/json',
                parents: ['appDataFolder']  // Store in App Data folder for better privacy
            };
            
            try {
                const createResponse = await gapi.client.drive.files.create({
                    resource: fileMetadata,
                    fields: 'id, name'
                });
                
                console.log(`Created new file '${fileName}' in App Data folder`);
                return {
                    id: createResponse.result.id,
                    name: createResponse.result.name
                };
            } catch (createError) {
                console.warn('Failed to create file in App Data folder, trying My Drive', createError);
                
                // Try creating in My Drive as fallback
                const regularFileMetadata = {
                    name: fileName,
                    mimeType: 'application/json'
                };
                
                const regularCreateResponse = await gapi.client.drive.files.create({
                    resource: regularFileMetadata,
                    fields: 'id, name'
                });
                
                console.log(`Created new file '${fileName}' in My Drive`);
                return {
                    id: regularCreateResponse.result.id,
                    name: regularCreateResponse.result.name
                };
            }
            
        } catch (error) {
            console.error('Error finding or creating file in Google Drive', error);
            throw error;
        }
    }
      // Sync notes to OneDrive using Microsoft Graph API
    async syncToOneDrive(notes) {
        try {
            const fileContent = JSON.stringify(notes);
            const token = authManager.authToken;
            
            if (!token) {
                throw new Error('No authentication token available');
            }
            
            // Use the AppFolder special folder for app-specific data
            // This is better for privacy and reduces clutter in user's main drive
            
            // First check if file exists 
            let fileExists = false;
            let fileId = null;
            
            try {
                const checkResponse = await fetch(`https://graph.microsoft.com/v1.0/me/drive/special/approot:/${this.FILE_NAME}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (checkResponse.ok) {
                    fileExists = true;
                    const fileData = await checkResponse.json();
                    fileId = fileData.id;
                    console.log(`Found existing file '${this.FILE_NAME}' in OneDrive app folder`);
                }
            } catch (e) {
                console.log('File does not exist in OneDrive app folder, will create new file');
                fileExists = false;
            }
            
            // Create a blob from the JSON data
            const blob = new Blob([fileContent], {type: 'application/json'});
            
            // Upload file - always use the PUT content approach for simplicity and consistency
            const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/special/approot:/${this.FILE_NAME}:/content`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: fileContent
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OneDrive sync failed: ${response.status} - ${errorData.error ? errorData.error.message : 'Unknown error'}`);
            }
            
            // Update sync timestamp
            this.lastSyncTime = new Date().toISOString();
            localStorage.setItem('sticky-cp9-last-sync-time', this.lastSyncTime);
            
            // Update conflict handling metadata if needed
            const responseData = await response.json();
            
            console.log('Notes synced to OneDrive successfully');
            return { 
                success: true, 
                timestamp: this.lastSyncTime,
                fileId: responseData.id
            };
            
        } catch (error) {
            console.error('Error syncing to OneDrive', error);
            throw error;
        }
    }
      // Sync groups to OneDrive using Microsoft Graph API
    async syncGroupsToOneDrive(groups) {
        try {
            const fileContent = JSON.stringify(groups);
            const token = authManager.authToken;
            
            if (!token) {
                throw new Error('No authentication token available');
            }
            
            // Use the AppFolder special folder for app-specific data
            
            // First check if file exists
            let fileExists = false;
            let fileId = null;
            
            try {
                const checkResponse = await fetch(`https://graph.microsoft.com/v1.0/me/drive/special/approot:/${this.GROUP_FILE_NAME}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (checkResponse.ok) {
                    fileExists = true;
                    const fileData = await checkResponse.json();
                    fileId = fileData.id;
                    console.log(`Found existing groups file '${this.GROUP_FILE_NAME}' in OneDrive app folder`);
                }
            } catch (e) {
                console.log('Groups file does not exist in OneDrive app folder, will create new file');
                fileExists = false;
            }
            
            // Create a blob from the JSON data
            const blob = new Blob([fileContent], {type: 'application/json'});
            
            // Upload file - always use the PUT content approach for simplicity
            const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/special/approot:/${this.GROUP_FILE_NAME}:/content`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: fileContent
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OneDrive group sync failed: ${response.status} - ${errorData.error ? errorData.error.message : 'Unknown error'}`);
            }
            
            // Get the response data for metadata
            const responseData = await response.json();
            
            console.log('Groups synced to OneDrive successfully');
            return { 
                success: true,
                fileId: responseData.id
            };
            
        } catch (error) {
            console.error('Error syncing groups to OneDrive', error);
            throw error;
        }
    }
    
    // Load notes from cloud storage
    async loadNotes() {
        if (!this.isInitialized) {
            throw new Error('Sync manager not initialized');
        }
        
        if (this.developmentMode) {
            // Simulate loading from cloud
            return this.simulateCloudLoad();
        }
        
        // Select provider
        if (authManager.provider === 'google') {
            return this.loadFromGoogleDrive();
        } else if (authManager.provider === 'microsoft') {
            return this.loadFromOneDrive();
        } else {
            throw new Error('Unknown provider');
        }
    }
    
    // Load groups from cloud storage
    async loadGroups() {
        if (!this.isInitialized) {
            throw new Error('Sync manager not initialized');
        }
        
        if (this.developmentMode) {
            // Simulate loading from cloud
            return this.simulateGroupLoad();
        }
        
        // Select provider
        if (authManager.provider === 'google') {
            return this.loadGroupsFromGoogleDrive();
        } else if (authManager.provider === 'microsoft') {
            return this.loadGroupsFromOneDrive();
        } else {
            throw new Error('Unknown provider');
        }
    }
    
    // Simulate loading from cloud for development mode
    simulateCloudLoad() {
        console.log('Development mode: Simulating loading notes from cloud');
        return Promise.resolve([]);
    }
    
    // Simulate loading groups from cloud for development mode
    simulateGroupLoad() {
        console.log('Development mode: Simulating loading groups from cloud');
        return Promise.resolve([]);
    }
      // Load notes from Google Drive
    async loadFromGoogleDrive() {
        try {
            // Check if the Google API client is loaded and initialized
            if (!gapi.client.getToken()) {
                throw new Error('Google API client not authenticated');
            }
            
            // Try to find the file in App Data folder first (preferred location)
            let fileId = null;
            
            try {
                const appDataResponse = await gapi.client.drive.files.list({
                    q: `name='${this.FILE_NAME}' and trashed=false`,
                    fields: 'files(id, name)',
                    spaces: 'appDataFolder'
                });
                
                const appDataFiles = appDataResponse.result.files;
                
                if (appDataFiles && appDataFiles.length > 0) {
                    console.log(`Found notes file in App Data folder`);
                    fileId = appDataFiles[0].id;
                }
            } catch (appDataError) {
                console.warn('Error searching App Data folder, falling back to regular search', appDataError);
            }
            
            // If not found in App Data, search in My Drive
            if (!fileId) {
                const response = await gapi.client.drive.files.list({
                    q: `name='${this.FILE_NAME}' and trashed=false`,
                    fields: 'files(id, name)'
                });
                
                const files = response.result.files;
                
                if (!files || files.length === 0) {
                    console.log('No notes file found on Google Drive');
                    return [];
                }
                
                fileId = files[0].id;
            }
            
            // Get file content
            try {
                const getResponse = await gapi.client.drive.files.get({
                    fileId: fileId,
                    alt: 'media'
                });
                
                return JSON.parse(getResponse.body);
            } catch (getError) {
                // If we get an error reading the file, try the download URL approach as fallback
                console.warn('Error reading file directly, trying download URL approach', getError);
                
                const metadataResponse = await gapi.client.drive.files.get({
                    fileId: fileId,
                    fields: 'webContentLink,downloadUrl'
                });
                
                // Use fetch to download the file content
                const downloadResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                    headers: {
                        'Authorization': `Bearer ${gapi.auth.getToken().access_token}`
                    }
                });
                
                if (!downloadResponse.ok) {
                    throw new Error(`Failed to download file: ${downloadResponse.status}`);
                }
                
                const fileContent = await downloadResponse.json();
                return fileContent;
            }
            
        } catch (error) {
            console.error('Error loading notes from Google Drive', error);
            // Return empty array on error as a fallback
            return [];
        }
    }
      // Load groups from Google Drive
    async loadGroupsFromGoogleDrive() {
        try {
            // Check if the Google API client is loaded and initialized
            if (!gapi.client.getToken()) {
                throw new Error('Google API client not authenticated');
            }
            
            // Try to find the file in App Data folder first (preferred location)
            let fileId = null;
            
            try {
                const appDataResponse = await gapi.client.drive.files.list({
                    q: `name='${this.GROUP_FILE_NAME}' and trashed=false`,
                    fields: 'files(id, name)',
                    spaces: 'appDataFolder'
                });
                
                const appDataFiles = appDataResponse.result.files;
                
                if (appDataFiles && appDataFiles.length > 0) {
                    console.log(`Found groups file in App Data folder`);
                    fileId = appDataFiles[0].id;
                }
            } catch (appDataError) {
                console.warn('Error searching App Data folder, falling back to regular search', appDataError);
            }
            
            // If not found in App Data, search in My Drive
            if (!fileId) {
                const response = await gapi.client.drive.files.list({
                    q: `name='${this.GROUP_FILE_NAME}' and trashed=false`,
                    fields: 'files(id, name)'
                });
                
                const files = response.result.files;
                
                if (!files || files.length === 0) {
                    console.log('No groups file found on Google Drive');
                    return [];
                }
                
                fileId = files[0].id;
            }
            
            // Get file content
            try {
                const getResponse = await gapi.client.drive.files.get({
                    fileId: fileId,
                    alt: 'media'
                });
                
                return JSON.parse(getResponse.body);
            } catch (getError) {
                // If we get an error reading the file, try the download URL approach as fallback
                console.warn('Error reading groups file directly, trying download URL approach', getError);
                
                // Use fetch to download the file content
                const downloadResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                    headers: {
                        'Authorization': `Bearer ${gapi.auth.getToken().access_token}`
                    }
                });
                
                if (!downloadResponse.ok) {
                    throw new Error(`Failed to download groups file: ${downloadResponse.status}`);
                }
                
                const fileContent = await downloadResponse.json();
                return fileContent;
            }
            
        } catch (error) {
            console.error('Error loading groups from Google Drive', error);
            // Return empty array on error as a fallback
            return [];
        }
    }
      // Load notes from OneDrive
    async loadFromOneDrive() {
        try {
            const token = authManager.authToken;
            
            if (!token) {
                throw new Error('No authentication token available');
            }
            
            // Try to get file from AppRoot special folder
            const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/special/approot:/${this.FILE_NAME}:/content`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.log('No notes file found on OneDrive');
                    return [];
                }
                
                // Try to get additional error information
                try {
                    const errorData = await response.json();
                    throw new Error(`OneDrive load failed: ${response.status} - ${errorData.error ? errorData.error.message : 'Unknown error'}`);
                } catch (jsonError) {
                    throw new Error(`OneDrive load failed with status: ${response.status}`);
                }
            }
            
            try {
                const data = await response.json();
                return data;
            } catch (parseError) {
                console.error('Error parsing OneDrive response as JSON', parseError);
                
                // Try to get the content as text and parse it
                const textResponse = await fetch(`https://graph.microsoft.com/v1.0/me/drive/special/approot:/${this.FILE_NAME}:/content`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!textResponse.ok) {
                    throw new Error('Failed to retrieve notes data from OneDrive');
                }
                
                const textContent = await textResponse.text();
                try {
                    return JSON.parse(textContent);
                } catch (textParseError) {
                    console.error('Failed to parse text content as JSON', textParseError);
                    return [];
                }
            }
            
        } catch (error) {
            console.error('Error loading notes from OneDrive', error);
            // Return empty array on error rather than throwing
            return [];
        }
    }
      // Load groups from OneDrive
    async loadGroupsFromOneDrive() {
        try {
            const token = authManager.authToken;
            
            if (!token) {
                throw new Error('No authentication token available');
            }
            
            // Try to get file from AppRoot special folder
            const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/special/approot:/${this.GROUP_FILE_NAME}:/content`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.log('No groups file found on OneDrive');
                    return [];
                }
                
                // Try to get additional error information
                try {
                    const errorData = await response.json();
                    throw new Error(`OneDrive groups load failed: ${response.status} - ${errorData.error ? errorData.error.message : 'Unknown error'}`);
                } catch (jsonError) {
                    throw new Error(`OneDrive groups load failed with status: ${response.status}`);
                }
            }
            
            try {
                const data = await response.json();
                return data;
            } catch (parseError) {
                console.error('Error parsing OneDrive groups response as JSON', parseError);
                
                // Try to get the content as text and parse it
                const textResponse = await fetch(`https://graph.microsoft.com/v1.0/me/drive/special/approot:/${this.GROUP_FILE_NAME}:/content`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!textResponse.ok) {
                    throw new Error('Failed to retrieve groups data from OneDrive');
                }
                
                const textContent = await textResponse.text();
                try {
                    return JSON.parse(textContent);
                } catch (textParseError) {
                    console.error('Failed to parse groups text content as JSON', textParseError);
                    return [];
                }
            }
            
        } catch (error) {
            console.error('Error loading groups from OneDrive', error);
            // Return empty array on error rather than throwing
            return [];
        }
    }
}

// Create and export sync manager instance
const syncManager = new SyncManager();
