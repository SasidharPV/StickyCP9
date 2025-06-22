// Authentication Module for StickyCP9
// Handles Google Drive and OneDrive authentication

class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.provider = null;
        this.userProfile = null;
        this.authToken = null;
        this.msalInstance = null;
        this.googleClient = null;
        this.developmentMode = config.developmentMode || false;
        this.multiAccountEnabled = config.multiAccount?.enabled || false;
        this.savedAccounts = this.loadSavedAccounts();
        this.currentAccountIndex = 0;
        
        // Initialize authentication libraries
        this.initAuthLibraries();
        
        // Try to restore auth session
        this.restoreSession();
        
        // Set up message listeners for OAuth popup callbacks
        window.addEventListener('message', this.handleAuthMessage.bind(this), false);
        
        // Show development mode notice if enabled
        if (this.developmentMode) {
            console.log('%c DEVELOPMENT MODE ACTIVE ', 'background: #FFC107; color: #000; font-weight: bold; padding: 5px;');
            console.log('Cloud sync is simulated. Set developmentMode to false in config.js to use real authentication.');
        }
        
        // Show multi-account mode notice if enabled
        if (this.multiAccountEnabled) {
            console.log('%c MULTI-ACCOUNT MODE ENABLED ', 'background: #4CAF50; color: #fff; font-weight: bold; padding: 5px;');
        }
    }
    
    // Initialize authentication libraries
    async initAuthLibraries() {
        if (this.developmentMode) return;
        
        // Initialize Microsoft Authentication Library
        if (window.msal) {
            this.msalInstance = new msal.PublicClientApplication({
                auth: {
                    clientId: config.microsoft.clientId,
                    redirectUri: config.microsoft.redirectUri,
                    authority: "https://login.microsoftonline.com/common"
                },
                cache: {
                    cacheLocation: "localStorage",
                    storeAuthStateInCookie: true
                }
            });
        }
        
        // Initialize Google API Client
        if (window.gapi) {
            await new Promise((resolve) => {
                gapi.load('client:auth2', resolve);
            });
            
            await gapi.client.init({
                apiKey: config.google.apiKey,
                clientId: config.google.clientId,
                discoveryDocs: config.google.discoveryDocs,
                scope: config.google.scope
            });
            
            this.googleClient = gapi.auth2.getAuthInstance();
        }
    }
    
    // Handle authentication messages from popup window
    handleAuthMessage(event) {
        // Only accept messages from our origin
        if (event.origin !== window.location.origin) return;
        
        const { type, provider, token, error } = event.data;
        
        if (type === 'auth-callback' && token) {
            if (provider === 'google') {
                this.handleGoogleAuthCallback(token);
            } else if (provider === 'microsoft') {
                this.handleMicrosoftAuthCallback(token);
            }
        } else if (type === 'auth-error' && error) {
            console.error('Authentication error:', error);
            this.showAuthError(error);
        }
    }
    
    // Show authentication error message
    showAuthError(error) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> Authentication error: ${error}`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
    }
    
    // Restore any existing session
    restoreSession() {
        const authData = localStorage.getItem('sticky-cp9-auth');
        if (authData) {
            try {
                const data = JSON.parse(authData);
                this.isAuthenticated = data.isAuthenticated;
                this.provider = data.provider;
                this.userProfile = data.userProfile;
                this.authToken = data.authToken;
                
                // Update UI if authenticated
                if (this.isAuthenticated && this.userProfile) {
                    this.updateUserUI();
                    this.notifyAuthStateChanged();
                }
                
                console.log(`Restored ${this.provider} authentication session`);
            } catch (err) {
                console.error('Failed to restore authentication session', err);
                this.clearSession();
            }
        }
    }
    
    // Save current session
    saveSession() {
        const authData = {
            isAuthenticated: this.isAuthenticated,
            provider: this.provider,
            userProfile: this.userProfile,
            authToken: this.authToken
        };
        localStorage.setItem('sticky-cp9-auth', JSON.stringify(authData));
    }
    
    // Clear session
    clearSession() {
        this.isAuthenticated = false;
        this.provider = null;
        this.userProfile = null;
        this.authToken = null;
        localStorage.removeItem('sticky-cp9-auth');
        
        // Update UI
        const userBtn = document.getElementById('user-profile');
        if (userBtn) {
            userBtn.style.display = 'none';
        }
    }
    
    // Update user UI with profile info
    updateUserUI() {
        const userBtn = document.getElementById('user-profile');
        const userAvatar = document.getElementById('user-avatar');
        
        if (userBtn && userAvatar && this.userProfile) {
            if (this.userProfile.imageUrl) {
                userAvatar.src = this.userProfile.imageUrl;
                userBtn.style.display = 'flex';
            }
        }
    }
    
    // Notify app about auth state change
    notifyAuthStateChanged(signedOut = false) {
        const event = new CustomEvent('authStateChanged', {
            detail: {
                isAuthenticated: this.isAuthenticated,
                provider: this.provider,
                userProfile: this.userProfile,
                signedOut: signedOut
            }
        });
        document.dispatchEvent(event);
    }
      // Initialize Google Auth
    async initGoogleAuth() {
        return new Promise((resolve, reject) => {
            if (this.developmentMode) {
                resolve(true);
                return;
            }
            
            // Check if Google API client is loaded
            if (!window.gapi) {
                console.error('Google API client library not loaded');
                reject(new Error('Google API client library not loaded'));
                return;
            }
            
            gapi.load('client:auth2', async () => {
                try {
                    await gapi.client.init({
                        apiKey: config.google.apiKey,
                        clientId: config.google.clientId,
                        discoveryDocs: config.google.discoveryDocs,
                        scope: config.google.scope
                    });
                    
                    // Store the auth instance for later use
                    this.googleClient = gapi.auth2.getAuthInstance();
                    
                    // Check if already signed in
                    if (this.googleClient.isSignedIn.get()) {
                        const googleUser = this.googleClient.currentUser.get();
                        this.handleGoogleAuth(googleUser);
                        resolve(true);
                        return;
                    }
                    
                    // Listen for sign-in state changes
                    this.googleClient.isSignedIn.listen((isSignedIn) => {
                        if (isSignedIn) {
                            const googleUser = this.googleClient.currentUser.get();
                            this.handleGoogleAuth(googleUser);
                        }
                    });
                    
                    resolve(false);
                } catch (error) {
                    console.error('Error initializing Google Auth', error);
                    reject(error);
                }
            });
        });
    }
      // Sign in with Google
    async signInWithGoogle() {
        if (this.developmentMode) {
            // Simulate successful authentication in development mode
            this.provider = 'google';
            this.isAuthenticated = true;
            this.authToken = 'dev-mode-token';
            this.userProfile = {
                id: 'dev-user-id',
                name: 'Development User',
                email: 'dev@example.com',
                imageUrl: 'https://ui-avatars.com/api/?name=Dev+User&background=4e54c8&color=fff'
            };
            
            // Save session
            this.saveSession();
            
            // Update UI
            this.updateUserUI();
            
            // Notify app
            this.notifyAuthStateChanged();
            return;
        }
        
        try {
            // Initialize the Google Auth API if needed
            if (!this.googleClient) {
                await this.initGoogleAuth();
            }
            
            if (!this.googleClient) {
                throw new Error('Failed to initialize Google authentication');
            }
            
            // Use the Google Sign-In API directly for better user experience
            const googleUser = await this.googleClient.signIn({
                scope: config.google.scope,
                prompt: 'select_account'
            });
            
            // Process the signed in user
            this.handleGoogleAuth(googleUser);
            
            console.log('Google sign-in successful');
            
        } catch (error) {
            // Handle sign-in errors or user cancellation
            if (error.error === 'popup_closed_by_user') {
                console.log('Sign-in popup closed by user');
            } else {
                console.error('Error signing in with Google', error);
                this.showAuthError(error.message || 'Failed to sign in with Google');
            }
        }
    }
    
    // Handle Google auth callback with token
    async handleGoogleAuthCallback(token) {
        try {
            // Set up client with the token
            gapi.client.setToken({ access_token: token });
            
            // Get user profile
            const userInfoResponse = await gapi.client.oauth2.userinfo.get();
            const userInfo = userInfoResponse.result;
            
            // Set auth data
            this.isAuthenticated = true;
            this.provider = 'google';
            this.authToken = token;
            this.userProfile = {
                id: userInfo.id,
                name: userInfo.name,
                email: userInfo.email,
                imageUrl: userInfo.picture
            };
            
            // Save session
            this.saveSession();
            
            // Update UI
            this.updateUserUI();
            
            // Notify app
            this.notifyAuthStateChanged();
            
        } catch (error) {
            console.error('Error handling Google auth callback', error);
            this.showAuthError('Failed to process Google sign-in');
        }
    }
      // Handle Google auth directly from auth instance
    async handleGoogleAuth(googleUser) {
        const profile = googleUser.getBasicProfile();
        const token = googleUser.getAuthResponse().access_token;
        
        this.isAuthenticated = true;
        this.provider = 'google';
        this.authToken = token;
        this.userProfile = {
            id: profile.getId(),
            name: profile.getName(),
            email: profile.getEmail(),
            imageUrl: profile.getImageUrl()
        };
        
        // Save session
        this.saveSession();
        
        // Update UI
        this.updateUserUI();
        
        // Save to multi-account list
        if (this.multiAccountEnabled) {
            this.saveAccountToList({
                isAuthenticated: this.isAuthenticated,
                provider: this.provider,
                authToken: this.authToken,
                userProfile: this.userProfile
            });
        }
        
        // Notify app
        this.notifyAuthStateChanged();
    }
      // Initialize Microsoft Auth using MSAL
    initMicrosoftAuth() {
        if (this.developmentMode) {
            return Promise.resolve(true);
        }
        
        if (!window.msal) {
            console.error('Microsoft Authentication Library (MSAL) not loaded');
            return Promise.reject(new Error('Microsoft Authentication Library (MSAL) not loaded'));
        }
          try {
            // Initialize MSAL application
            this.msalInstance = new msal.PublicClientApplication({
                auth: {
                    clientId: config.microsoft.clientId,
                    redirectUri: config.microsoft.redirectUri,
                    authority: 'https://login.microsoftonline.com/common'
                },
                cache: {
                    cacheLocation: 'localStorage',
                    storeAuthStateInCookie: true
                }
            });
            
            // Check if there are already signed in accounts
            const accounts = this.msalInstance.getAllAccounts();
            if (accounts && accounts.length > 0) {
                // User is already signed in
                const account = accounts[0];
                return this.getMicrosoftUserInfo(account).then(() => true);
            }
            
            return Promise.resolve(false);
        } catch (error) {
            console.error('Error initializing Microsoft Authentication', error);
            return Promise.reject(error);
        }
    }
    
    // Sign in with Microsoft using MSAL
    async signInWithMicrosoft() {
        if (this.developmentMode) {
            // Simulate successful authentication in development mode
            this.provider = 'microsoft';
            this.isAuthenticated = true;
            this.authToken = 'dev-mode-token';
            this.userProfile = {
                id: 'dev-user-id',
                name: 'Development User',
                email: 'dev@example.com',
                imageUrl: 'https://ui-avatars.com/api/?name=Dev+User&background=4e54c8&color=fff'
            };
            
            // Save session
            this.saveSession();
            
            // Update UI
            this.updateUserUI();
            
            // Notify app
            this.notifyAuthStateChanged();
            return;
        }
        
        try {
            // Initialize MSAL if not already done
            if (!this.msalInstance) {
                await this.initMicrosoftAuth();
            }
            
            if (!this.msalInstance) {
                throw new Error('Failed to initialize Microsoft authentication');
            }
            
            // Login request parameters
            const loginRequest = {
                scopes: config.microsoft.scopes,
                prompt: 'select_account'
            };
            
            // Attempt to login with popup
            const response = await this.msalInstance.loginPopup(loginRequest);
            
            // Process the response
            if (response && response.account) {
                await this.getMicrosoftUserInfo(response.account);
                console.log('Microsoft sign-in successful');
            } else {
                throw new Error('No account information received from Microsoft');
            }
        } catch (error) {
            // Handle sign-in errors
            if (error.name === 'PopupCancelledError' || error.name === 'UserCancelledError') {
                console.log('Sign-in popup closed by user');
            } else {
                console.error('Error signing in with Microsoft', error);
                this.showAuthError(error.message || 'Failed to sign in with Microsoft');
            }
        }
    }
    
    // Get Microsoft user info using Graph API
    async getMicrosoftUserInfo(account) {
        try {
            // Get tokens for Microsoft Graph API
            const tokenResponse = await this.msalInstance.acquireTokenSilent({
                scopes: ['User.Read'],
                account: account
            });
            
            // Get user profile from Microsoft Graph
            const response = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: {
                    'Authorization': `Bearer ${tokenResponse.accessToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch user profile from Microsoft');
            }
            
            const userInfo = await response.json();
            
            // Store auth data
            this.isAuthenticated = true;
            this.provider = 'microsoft';
            this.authToken = tokenResponse.accessToken;
            this.userProfile = {
                id: userInfo.id,
                name: userInfo.displayName,
                email: userInfo.mail || userInfo.userPrincipalName,
                imageUrl: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userInfo.displayName) + '&background=4e54c8&color=fff'
            };
            
            // Try to get user photo if available
            try {
                const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
                    headers: {
                        'Authorization': `Bearer ${tokenResponse.accessToken}`
                    }
                });
                
                if (photoResponse.ok) {
                    const blob = await photoResponse.blob();
                    this.userProfile.imageUrl = URL.createObjectURL(blob);
                }
            } catch (photoError) {
                console.warn('Could not fetch user photo from Microsoft', photoError);
            }
              // Save session and update UI
            this.saveSession();
            this.updateUserUI();
            
            // Save to multi-account list
            if (this.multiAccountEnabled) {
                this.saveAccountToList({
                    isAuthenticated: this.isAuthenticated,
                    provider: this.provider,
                    authToken: this.authToken,
                    userProfile: this.userProfile
                });
            }
            
            this.notifyAuthStateChanged();
            
            return this.userProfile;
        } catch (error) {
            console.error('Error getting Microsoft user info', error);
            throw error;
        }
    }
    
    // Handle Microsoft auth callback with token
    async handleMicrosoftAuthCallback(token) {
        try {
            // Get user profile from Microsoft Graph API
            const response = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch user profile from Microsoft');
            }
            
            const userInfo = await response.json();
            
            // Set auth data
            this.isAuthenticated = true;
            this.provider = 'microsoft';
            this.authToken = token;
            this.userProfile = {
                id: userInfo.id,
                name: userInfo.displayName,
                email: userInfo.mail || userInfo.userPrincipalName,
                imageUrl: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userInfo.displayName) + '&background=4e54c8&color=fff'
            };
            
            // Try to get user photo if available
            try {
                const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (photoResponse.ok) {
                    const blob = await photoResponse.blob();
                    this.userProfile.imageUrl = URL.createObjectURL(blob);
                }
            } catch (photoError) {
                console.warn('Could not fetch user photo from Microsoft', photoError);
            }
            
            // Save session
            this.saveSession();
            
            // Update UI
            this.updateUserUI();
            
            // Notify app
            this.notifyAuthStateChanged();
            
        } catch (error) {
            console.error('Error handling Microsoft auth callback', error);
            this.showAuthError('Failed to process Microsoft sign-in');
        }
    }
      // Sign out
    async signOut() {
        if (this.developmentMode) {
            // Just reset state in dev mode
            const wasAuthenticated = this.isAuthenticated;
            this.clearSession();
            
            if (wasAuthenticated) {
                this.notifyAuthStateChanged(true);
            }
            return;
        }
        
        try {
            // Track the current authenticated state
            const wasAuthenticated = this.isAuthenticated;
            const currentProvider = this.provider;
            
            // Sign out based on provider
            if (currentProvider === 'google' && this.googleClient) {
                try {
                    await this.googleClient.signOut();
                    console.log('User signed out of Google');
                } catch (googleError) {
                    console.warn('Error during Google sign out', googleError);
                }
            } else if (currentProvider === 'microsoft' && this.msalInstance) {
                try {
                    // Get all accounts
                    const accounts = this.msalInstance.getAllAccounts();
                    
                    // Sign out all accounts
                    if (accounts && accounts.length > 0) {
                        const logoutRequest = {
                            account: this.msalInstance.getAccountByHomeId(accounts[0].homeAccountId),
                            postLogoutRedirectUri: window.location.origin
                        };
                        
                        await this.msalInstance.logoutPopup(logoutRequest);
                        console.log('User signed out of Microsoft');
                    }
                } catch (msError) {
                    console.warn('Error during Microsoft sign out', msError);
                }
            }
            
            // Clear session regardless of provider and any errors
            this.clearSession();
            
            // Notify if we were previously authenticated
            if (wasAuthenticated) {
                this.notifyAuthStateChanged(true);
            }
            
        } catch (error) {
            console.error('Error signing out', error);
            
            // Clear session anyway in case of errors
            this.clearSession();
            this.notifyAuthStateChanged(true);
        }
   }

    // Load saved accounts from localStorage
    loadSavedAccounts() {
        if (!this.multiAccountEnabled) return [];
        
        const saved = localStorage.getItem('sticky-cp9-saved-accounts');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (err) {
                console.error('Failed to load saved accounts', err);
            }
        }
        return [];
    }
    
    // Save account to the list of saved accounts
    saveAccountToList(accountData) {
        if (!this.multiAccountEnabled) return;
        
        const maxAccounts = config.multiAccount?.maxAccounts || 5;
        const accountId = `${accountData.provider}_${accountData.userProfile.id}`;
        
        // Remove existing account with same ID
        this.savedAccounts = this.savedAccounts.filter(acc => 
            `${acc.provider}_${acc.userProfile.id}` !== accountId
        );
        
        // Add new account to the beginning
        this.savedAccounts.unshift(accountData);
        
        // Limit to max accounts
        if (this.savedAccounts.length > maxAccounts) {
            this.savedAccounts = this.savedAccounts.slice(0, maxAccounts);
        }
        
        // Save to localStorage
        localStorage.setItem('sticky-cp9-saved-accounts', JSON.stringify(this.savedAccounts));
        
        // Update UI
        this.updateAccountSwitcher();
    }
    
    // Remove account from saved accounts
    removeAccountFromList(accountId) {
        if (!this.multiAccountEnabled) return;
        
        this.savedAccounts = this.savedAccounts.filter(acc => 
            `${acc.provider}_${acc.userProfile.id}` !== accountId
        );
        
        localStorage.setItem('sticky-cp9-saved-accounts', JSON.stringify(this.savedAccounts));
        this.updateAccountSwitcher();
    }
    
    // Switch to a different account
    async switchToAccount(accountIndex) {
        if (!this.multiAccountEnabled || accountIndex >= this.savedAccounts.length) return;
        
        const accountData = this.savedAccounts[accountIndex];
        
        try {
            // Clear current session
            this.clearSession();
            
            // Set new account data
            this.isAuthenticated = accountData.isAuthenticated;
            this.provider = accountData.provider;
            this.userProfile = accountData.userProfile;
            this.authToken = accountData.authToken;
            this.currentAccountIndex = accountIndex;
            
            // Verify token is still valid
            const isValid = await this.verifyToken();
            
            if (isValid) {
                // Save as current session
                this.saveSession();
                this.updateUserUI();
                this.notifyAuthStateChanged();
                
                // Move this account to the front of the list
                this.saveAccountToList(accountData);
                
                console.log(`Switched to ${accountData.provider} account: ${accountData.userProfile.name}`);
                
                // Show success message
                this.showSwitchAccountMessage(`Switched to ${accountData.userProfile.name}`, 'success');
            } else {
                // Token expired, need to re-authenticate
                console.log(`Token expired for ${accountData.userProfile.name}, please sign in again`);
                this.showSwitchAccountMessage(`Token expired for ${accountData.userProfile.name}. Please sign in again.`, 'warning');
                
                // Remove invalid account
                this.removeAccountFromList(`${accountData.provider}_${accountData.userProfile.id}`);
            }
        } catch (error) {
            console.error('Error switching accounts', error);
            this.showSwitchAccountMessage('Failed to switch account. Please try again.', 'error');
        }
    }
    
    // Verify if the current token is still valid
    async verifyToken() {
        if (!this.authToken || !this.provider) return false;
        
        try {
            if (this.provider === 'google') {
                // Verify Google token
                const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${this.authToken}`);
                return response.ok;
            } else if (this.provider === 'microsoft') {
                // Verify Microsoft token
                const response = await fetch('https://graph.microsoft.com/v1.0/me', {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                });
                return response.ok;
            }
        } catch (error) {
            console.error('Token verification failed', error);
            return false;
        }
        
        return false;
    }
    
    // Show account switch message
    showSwitchAccountMessage(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<i class="fas fa-user-check"></i> ${message}`;
        
        // Add specific styling for different message types
        if (type === 'success') {
            toast.style.backgroundColor = '#4CAF50';
        } else if (type === 'warning') {
            toast.style.backgroundColor = '#FF9800';
        } else if (type === 'error') {
            toast.style.backgroundColor = '#f44336';
        }
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 4000);
    }
    
    // Update account switcher UI
    updateAccountSwitcher() {
        if (!this.multiAccountEnabled) return;
        
        const userBtn = document.getElementById('user-profile');
        if (!userBtn) return;
        
        // Add dropdown arrow if not present
        if (!userBtn.querySelector('.dropdown-arrow')) {
            const arrow = document.createElement('i');
            arrow.className = 'fas fa-chevron-down dropdown-arrow';
            arrow.style.marginLeft = '5px';
            arrow.style.fontSize = '10px';
            userBtn.appendChild(arrow);
        }
        
        // Remove existing dropdown
        const existingDropdown = document.getElementById('account-switcher-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }
        
        // Create new dropdown if there are saved accounts
        if (this.savedAccounts.length > 0) {
            this.createAccountSwitcherDropdown();
        }
    }
    
    // Create account switcher dropdown
    createAccountSwitcherDropdown() {
        const userBtn = document.getElementById('user-profile');
        if (!userBtn) return;
        
        const dropdown = document.createElement('div');
        dropdown.id = 'account-switcher-dropdown';
        dropdown.className = 'account-switcher-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            min-width: 250px;
            z-index: 1000;
            display: none;
            margin-top: 5px;
        `;
        
        // Add saved accounts
        this.savedAccounts.forEach((account, index) => {
            const accountItem = document.createElement('div');
            accountItem.className = 'account-item';
            accountItem.style.cssText = `
                padding: 12px 16px;
                border-bottom: 1px solid #eee;
                cursor: pointer;
                display: flex;
                align-items: center;
                transition: background-color 0.2s;
            `;
            
            const isCurrentAccount = this.isAuthenticated && 
                this.provider === account.provider && 
                this.userProfile?.id === account.userProfile.id;
            
            if (isCurrentAccount) {
                accountItem.style.backgroundColor = '#f0f7ff';
                accountItem.style.borderLeft = '3px solid #4e54c8';
            }
            
            accountItem.innerHTML = `
                <img src="${account.userProfile.imageUrl}" alt="Avatar" style="
                    width: 32px; 
                    height: 32px; 
                    border-radius: 50%; 
                    margin-right: 12px;
                    object-fit: cover;
                ">
                <div style="flex: 1;">
                    <div style="font-weight: 500; color: #333; font-size: 14px;">
                        ${account.userProfile.name}
                    </div>
                    <div style="color: #666; font-size: 12px;">
                        ${account.userProfile.email} • ${account.provider}
                        ${isCurrentAccount ? ' • Current' : ''}
                    </div>
                </div>
                ${!isCurrentAccount ? `
                    <button class="remove-account-btn" style="
                        background: none;
                        border: none;
                        color: #999;
                        cursor: pointer;
                        padding: 4px;
                        margin-left: 8px;
                    " title="Remove account">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            `;
            
            // Add click handler for switching accounts
            if (!isCurrentAccount) {
                accountItem.addEventListener('click', (e) => {
                    if (!e.target.closest('.remove-account-btn')) {
                        this.switchToAccount(index);
                        dropdown.style.display = 'none';
                    }
                });
                
                // Add remove account handler
                const removeBtn = accountItem.querySelector('.remove-account-btn');
                if (removeBtn) {
                    removeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.removeAccountFromList(`${account.provider}_${account.userProfile.id}`);
                    });
                }
            }
            
            accountItem.addEventListener('mouseenter', () => {
                if (!isCurrentAccount) {
                    accountItem.style.backgroundColor = '#f5f5f5';
                }
            });
            
            accountItem.addEventListener('mouseleave', () => {
                if (!isCurrentAccount) {
                    accountItem.style.backgroundColor = 'white';
                }
            });
            
            dropdown.appendChild(accountItem);
        });
        
        // Add "Add Account" option
        const addAccountItem = document.createElement('div');
        addAccountItem.className = 'add-account-item';
        addAccountItem.style.cssText = `
            padding: 12px 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            color: #4e54c8;
            font-weight: 500;
            transition: background-color 0.2s;
        `;
        
        addAccountItem.innerHTML = `
            <i class="fas fa-plus" style="margin-right: 12px;"></i>
            Add Another Account
        `;
        
        addAccountItem.addEventListener('click', () => {
            dropdown.style.display = 'none';
            this.showAddAccountDialog();
        });
        
        addAccountItem.addEventListener('mouseenter', () => {
            addAccountItem.style.backgroundColor = '#f0f7ff';
        });
        
        addAccountItem.addEventListener('mouseleave', () => {
            addAccountItem.style.backgroundColor = 'white';
        });
        
        dropdown.appendChild(addAccountItem);
        
        // Position dropdown relative to user button
        userBtn.style.position = 'relative';
        userBtn.appendChild(dropdown);
        
        // Add click handler to user button
        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = dropdown.style.display === 'block';
            dropdown.style.display = isVisible ? 'none' : 'block';
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userBtn.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }
    
    // Show add account dialog
    showAddAccountDialog() {
        // Create dialog overlay
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        `;
        
        const dialog = document.createElement('div');
        dialog.className = 'dialog';
        dialog.style.cssText = `
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            max-width: 400px;
            width: 90%;
        `;
        
        dialog.innerHTML = `
            <div style="text-align: center;">
                <h3 style="margin: 0 0 16px 0; color: #333;">Add Another Account</h3>
                <p style="color: #666; margin-bottom: 24px;">
                    Choose a provider to add another account:
                </p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button id="add-google-account" class="btn primary" style="flex: 1;">
                        <i class="fab fa-google"></i> Google
                    </button>
                    <button id="add-microsoft-account" class="btn primary" style="flex: 1;">
                        <i class="fab fa-microsoft"></i> Microsoft
                    </button>
                </div>
                <button id="cancel-add-account" class="btn secondary" style="width: 100%; margin-top: 12px;">
                    Cancel
                </button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Add event handlers
        document.getElementById('add-google-account').addEventListener('click', () => {
            document.body.removeChild(overlay);
            this.signInWithGoogle();
        });
        
        document.getElementById('add-microsoft-account').addEventListener('click', () => {
            document.body.removeChild(overlay);
            this.signInWithMicrosoft();
        });
        
        document.getElementById('cancel-add-account').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });
    }
}

// Create and export auth manager instance
const authManager = new AuthManager();
