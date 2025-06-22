// Development mode notification
document.addEventListener('DOMContentLoaded', () => {
    if (config.developmentMode) {
        // Create development mode notification banner
        const banner = document.createElement('div');
        banner.className = 'dev-mode-banner';
        banner.innerHTML = `
            <div class="dev-mode-content">
                <i class="fas fa-code"></i>
                <span>Development Mode Active - Cloud sync is simulated</span>
            </div>
            <div class="dev-mode-actions">
                <a href="#" id="setup-instructions">Setup Instructions</a>
                <button id="close-dev-banner"><i class="fas fa-times"></i></button>
            </div>
        `;
        document.body.prepend(banner);
        
        // Add event listener to close button
        const closeBtn = document.getElementById('close-dev-banner');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                banner.style.display = 'none';
            });
        }
        
        // Add event listener to setup instructions link
        const setupLink = document.getElementById('setup-instructions');
        if (setupLink) {
            setupLink.addEventListener('click', (e) => {
                e.preventDefault();
                showSetupInstructions();
            });
        }
    }
    
    // Show setup instructions dialog
    function showSetupInstructions() {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        // Create modal container
        const modalContent = `
            <div class="modal-container setup-instructions">
                <div class="modal-header">
                    <h3>Cloud Sync Setup Instructions</h3>
                    <button class="modal-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="setup-step">
                        <h4>Step 1: Development Mode</h4>
                        <p>The app is currently in development mode, which simulates cloud sync without requiring real credentials.</p>
                        <p>To use real cloud sync, you'll need to set up OAuth credentials for Google Drive and/or Microsoft OneDrive.</p>
                    </div>
                    
                    <div class="setup-step">
                        <h4>Step 2: Google Drive API Setup</h4>
                        <ol>
                            <li>Go to <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
                            <li>Create a new project</li>
                            <li>In the sidebar, click on "APIs & Services" > "Library"</li>
                            <li>Search for "Google Drive API" and enable it</li>
                            <li>Go to "OAuth consent screen" and set up your app (can be in testing mode)</li>
                            <li>Go to "Credentials" and create an "OAuth client ID" (type: Web application)</li>
                            <li>Add authorized JavaScript origins (e.g., http://localhost or your domain)</li>
                            <li>Copy the Client ID and API Key from the credentials page</li>
                        </ol>
                    </div>
                    
                    <div class="setup-step">
                        <h4>Step 3: Microsoft OneDrive API Setup</h4>
                        <ol>
                            <li>Go to <a href="https://portal.azure.com/" target="_blank">Microsoft Azure Portal</a></li>
                            <li>Navigate to Azure Active Directory > App registrations</li>
                            <li>Register a new application</li>
                            <li>Set platform as SPA (Single Page Application)</li>
                            <li>Add redirect URIs to match your domain (the same as your origin)</li>
                            <li>Add Microsoft Graph permissions: Files.ReadWrite.AppFolder, offline_access</li>
                            <li>Copy the Application (client) ID</li>
                        </ol>
                    </div>
                    
                    <div class="setup-step">
                        <h4>Step 4: Update Config File</h4>
                        <p>Open the <code>src/config.js</code> file and:</p>
                        <ol>
                            <li>Set <code>developmentMode: false</code></li>
                            <li>Replace <code>YOUR_GOOGLE_CLIENT_ID</code> with your Google client ID</li>
                            <li>Replace <code>YOUR_GOOGLE_API_KEY</code> with your Google API key</li>
                            <li>Replace <code>YOUR_MICROSOFT_CLIENT_ID</code> with your Microsoft client ID</li>
                        </ol>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" id="btn-close-instructions">Got it!</button>
                </div>
            </div>
        `;
        
        modalOverlay.innerHTML = modalContent;
        document.body.appendChild(modalOverlay);
        
        // Show the modal
        setTimeout(() => {
            modalOverlay.classList.add('active');
        }, 10);
        
        // Add event listeners to close button
        const closeBtn = modalOverlay.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(modalOverlay);
            }, 300);
        });
        
        // Add event listener to got it button
        const gotItBtn = modalOverlay.querySelector('#btn-close-instructions');
        gotItBtn.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(modalOverlay);
            }, 300);
        });
    }
});
