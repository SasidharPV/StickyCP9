// OAuth Configuration
const config = {
    // Development mode - set to true to use local storage only, false to use cloud sync
    // When in development mode, the auth buttons will simulate successful authentication
    developmentMode: true,
    
    // Google Drive API credentials
    google: {
        clientId: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your actual Google OAuth client ID
        apiKey: 'YOUR_GOOGLE_API_KEY',     // Replace with your actual Google API key
        scope: 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file',
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
    },
    
    // Microsoft OneDrive API credentials
    microsoft: {
        clientId: 'YOUR_MICROSOFT_CLIENT_ID', // Replace with your actual Microsoft OAuth client ID
        redirectUri: window.location.origin, // This should match your redirect URI in Azure portal
        scopes: ['files.readwrite.appfolder', 'offline_access']
    },
    
    // GitHub repository info for sync
    github: {
        repo: 'SasidharPV/StickyCP9',
        branch: 'main'
    }
};

/* 
=== SETUP INSTRUCTIONS ===

1. Google Drive API Setup:
   a. Go to https://console.cloud.google.com/
   b. Create a new project
   c. In the sidebar, click on "APIs & Services" > "Library"
   d. Search for "Google Drive API" and enable it
   e. Go to "OAuth consent screen" and set up your app (can be in testing mode)
   f. Go to "Credentials" and create an "OAuth client ID" (type: Web application)
   g. Add authorized JavaScript origins (e.g., http://localhost or your domain)
   h. Copy the Client ID and replace 'YOUR_GOOGLE_CLIENT_ID'
   i. Create an API key and replace 'YOUR_GOOGLE_API_KEY'

2. Microsoft OneDrive API Setup:
   a. Go to https://portal.azure.com/
   b. Navigate to Azure Active Directory > App registrations
   c. Register a new application
   d. Set platform as SPA (Single Page Application)
   e. Add redirect URIs to match your domain (the same as your origin)
   f. Add Microsoft Graph permissions: Files.ReadWrite.AppFolder, offline_access
   g. Copy the Application (client) ID and replace 'YOUR_MICROSOFT_CLIENT_ID'

3. Development Mode:
   - While setting up your cloud credentials, keep developmentMode: true
   - This will allow you to test the app with simulated authentication
   - Once you have proper credentials, set developmentMode: false
*/
