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
}

// Create and export auth manager instance
const authManager = new AuthManager();
