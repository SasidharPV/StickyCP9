// OAuth Configuration
const config = {
    // Development mode - set to false to use real cloud sync
    // When in development mode, the auth buttons will simulate successful authentication
    developmentMode: false, // Set to true for testing without actual OAuth
    
    // Google Drive API credentials
    // To create your own credentials:
    // 1. Go to https://console.cloud.google.com/
    // 2. Create a new project
    // 3. Navigate to APIs & Services > OAuth consent screen
    // 4. Configure the consent screen (External type is fine for testing)
    // 5. Then go to Credentials > Create Credentials > OAuth client ID
    // 6. Select Web application, add your domain to Authorized JavaScript origins
    // 7. Add your domain + /auth-callback.html to Authorized redirect URIs
    google: {
        clientId: '743529461924-difp5a2o44gc3k8lb0u9b32t3926bqko.apps.googleusercontent.com',
        apiKey: 'AIzaSyAFPUZFhagvc2Nl15if7078GRw0yarWsmg',
        scope: 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest', 'https://www.googleapis.com/discovery/v1/apis/oauth2/v2/rest']
    },
    
    // Microsoft OneDrive API credentials
    // To create your own credentials:
    // 1. Go to https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
    // 2. Register a new application
    // 3. Set redirect URI to your domain (single-page application type)
    // 4. Add permissions for Microsoft Graph API (Files.ReadWrite.AppFolder, User.Read)
    microsoft: {
        clientId: 'c4eaf2ef-461a-409a-aff7-f77186e3af86',
        redirectUri: 'https://sasidharpv.github.io/StickyCP9/auth-callback.html', 
        scopes: ['files.readwrite.appfolder', 'user.read', 'offline_access']
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
