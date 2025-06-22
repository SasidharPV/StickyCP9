// Authentication Module for StickyCP9
// Handles Google Drive and OneDrive authentication

class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.provider = null;
        this.userProfile = null;
        this.authToken = null;
        this.msalInstance = null;
        this.developmentMode = config.developmentMode || false;
        
        // Try to restore auth session
        this.restoreSession();
        
        // Show development mode notice if enabled
        if (this.developmentMode) {
            console.log('%c DEVELOPMENT MODE ACTIVE ', 'background: #FFC107; color: #000; font-weight: bold; padding: 5px;');
            console.log('Cloud sync is simulated. Set developmentMode to false in config.js to use real authentication.');
        }
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
    
    // Initialize Google Auth
    async initGoogleAuth() {
        return new Promise((resolve, reject) => {
            gapi.load('client:auth2', async () => {
                try {
                    await gapi.client.init({
                        apiKey: config.google.apiKey,
                        clientId: config.google.clientId,
                        discoveryDocs: config.google.discoveryDocs,
                        scope: config.google.scope
                    });
                    
                    // Initialize Google Identity Services
                    google.accounts.id.initialize({
                        client_id: config.google.clientId,
                        callback: this.handleGoogleResponse.bind(this)
                    });
                    
                    resolve();
                } catch (error) {
                    console.error('Error initializing Google API client', error);
                    reject(error);
                }
            });
        });
    }
      // Sign in with Google
    async signInWithGoogle() {
        // Check if in development mode
        if (this.developmentMode) {
            console.log('Development mode: Simulating Google sign-in');
            
            // Create mock profile
            this.isAuthenticated = true;
            this.provider = 'google';
            this.authToken = 'dev-mode-token';
            this.userProfile = {
                id: 'dev-user-123',
                name: 'Dev User',
                email: 'dev@example.com',
                imageUrl: 'https://ui-avatars.com/api/?name=Dev+User&background=0D8ABC&color=fff'
            };
            
            this.saveSession();
            this.updateUserUI();
            
            // Notify app
            document.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { 
                    isAuthenticated: true,
                    provider: 'google',
                    userProfile: this.userProfile
                }
            }));
            
            return;
        }
        
        try {
            await this.initGoogleAuth();
            
            // Display Google One Tap
            google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    // If One Tap is not displayed, fall back to redirect auth
                    const authInstance = gapi.auth2.getAuthInstance();
                    authInstance.signIn().then(this.handleGoogleUserSignIn.bind(this));
                }
            });
            
        } catch (error) {
            console.error('Error signing in with Google', error);
            throw error;
        }
    }
    
    // Handle Google One Tap response
    handleGoogleResponse(response) {
        const idToken = response.credential;
        
        // Decode ID token to get user info
        const base64Url = idToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const { name, email, picture, sub } = JSON.parse(jsonPayload);
        
        this.isAuthenticated = true;
        this.provider = 'google';
        this.authToken = idToken;
        this.userProfile = {
            id: sub,
            name,
            email,
            imageUrl: picture
        };
        
        this.saveSession();
        this.updateUserUI();
        
        // Notify app
        document.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { 
                isAuthenticated: true,
                provider: 'google',
                userProfile: this.userProfile
            }
        }));
    }
    
    // Handle Google Sign-In
    handleGoogleUserSignIn(googleUser) {
        const profile = googleUser.getBasicProfile();
        const authResponse = googleUser.getAuthResponse(true);
        
        this.isAuthenticated = true;
        this.provider = 'google';
        this.authToken = authResponse.id_token;
        this.userProfile = {
            id: profile.getId(),
            name: profile.getName(),
            email: profile.getEmail(),
            imageUrl: profile.getImageUrl()
        };
        
        this.saveSession();
        this.updateUserUI();
        
        // Notify app
        document.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { 
                isAuthenticated: true,
                provider: 'google',
                userProfile: this.userProfile
            }
        }));
    }
    
    // Initialize Microsoft Auth
    initMicrosoftAuth() {
        // Create MSAL instance
        const msalConfig = {
            auth: {
                clientId: config.microsoft.clientId,
                redirectUri: config.microsoft.redirectUri
            },
            cache: {
                cacheLocation: "localStorage",
                storeAuthStateInCookie: true
            }
        };
        
        this.msalInstance = new msal.PublicClientApplication(msalConfig);
        
        // Check if user is already signed in
        const accounts = this.msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            // User is signed in
            this.handleMicrosoftAccount(accounts[0]);
        }
        
        // Handle redirect response
        this.msalInstance.handleRedirectPromise()
            .then(response => {
                if (response) {
                    this.handleMicrosoftAccount(response.account);
                }
            })
            .catch(error => {
                console.error('Error handling Microsoft redirect', error);
            });
    }
      // Sign in with Microsoft
    async signInWithMicrosoft() {
        // Check if in development mode
        if (this.developmentMode) {
            console.log('Development mode: Simulating Microsoft sign-in');
            
            // Create mock profile
            this.isAuthenticated = true;
            this.provider = 'microsoft';
            this.authToken = 'dev-mode-token';
            this.userProfile = {
                id: 'dev-user-456',
                name: 'Dev User',
                email: 'dev@example.com',
                imageUrl: 'https://ui-avatars.com/api/?name=Dev+User&background=2C52B0&color=fff'
            };
            
            this.saveSession();
            this.updateUserUI();
            
            // Notify app
            document.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { 
                    isAuthenticated: true,
                    provider: 'microsoft',
                    userProfile: this.userProfile
                }
            }));
            
            return;
        }
        
        if (!this.msalInstance) {
            this.initMicrosoftAuth();
        }
        
        try {
            // Login with popup
            const loginResponse = await this.msalInstance.loginPopup({
                scopes: config.microsoft.scopes,
                prompt: "select_account"
            });
            
            this.handleMicrosoftAccount(loginResponse.account);
            
        } catch (error) {
            console.error('Error signing in with Microsoft', error);
            throw error;
        }
    }
    
    // Handle Microsoft account info
    handleMicrosoftAccount(account) {
        this.isAuthenticated = true;
        this.provider = 'microsoft';
        this.userProfile = {
            id: account.homeAccountId,
            name: account.name,
            email: account.username,
            // Microsoft doesn't provide image URL directly, using placeholder
            imageUrl: 'https://via.placeholder.com/32/2C52B0/FFFFFF?text=' + account.name.substring(0, 2).toUpperCase()
        };
        
        // Get access token
        this.msalInstance.acquireTokenSilent({
            scopes: config.microsoft.scopes,
            account: account
        }).then(response => {
            this.authToken = response.accessToken;
            this.saveSession();
            this.updateUserUI();
            
            // Notify app
            document.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { 
                    isAuthenticated: true,
                    provider: 'microsoft',
                    userProfile: this.userProfile
                }
            }));
        }).catch(error => {
            console.error('Error acquiring token silently', error);
            // Fall back to popup
            this.msalInstance.acquireTokenPopup({
                scopes: config.microsoft.scopes
            }).then(response => {
                this.authToken = response.accessToken;
                this.saveSession();
                this.updateUserUI();
            });
        });
    }
      // Sign out user
    signOut() {
        // Check if in development mode
        if (this.developmentMode) {
            console.log('Development mode: Simulating sign-out');
            
            this.clearSession();
            
            // Notify app
            document.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { 
                    isAuthenticated: false,
                    provider: null,
                    userProfile: null,
                    signedOut: true
                }
            }));
            
            return;
        }
        
        if (this.provider === 'google') {
            // Sign out from Google
            const authInstance = gapi.auth2.getAuthInstance();
            if (authInstance) {
                authInstance.signOut();
            }
        } else if (this.provider === 'microsoft') {
            // Sign out from Microsoft
            if (this.msalInstance) {
                this.msalInstance.logout();
            }
        }
        
        this.clearSession();
        
        // Notify app
        document.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { 
                isAuthenticated: false,
                provider: null,
                userProfile: null,
                signedOut: true
            }
        }));
    }
}

// Create global auth manager instance
const authManager = new AuthManager();
