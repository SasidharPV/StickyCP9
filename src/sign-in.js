// Sign-in page module for StickyCP9
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is signed in
    const authData = localStorage.getItem('sticky-cp9-auth');
    const isAuthenticated = authData ? JSON.parse(authData).isAuthenticated : false;
    const offlineMode = localStorage.getItem('sticky-cp9-offline-mode') === 'true';
    
    // If not signed in and not in offline mode, show sign-in page
    if (!isAuthenticated && !offlineMode && !config.developmentMode) {
        showSignInPage();
    } else {
        // If already signed in or offline mode, show app content with small delay
        setTimeout(() => {
            // Display app content with animation
            const appContent = document.querySelector('.app-content');
            appContent.style.display = 'block';
            appContent.classList.add('visible');
        }, 100);
    }
    
    // Show sign-in page
    function showSignInPage() {
        // Create sign-in page
        const signInPage = document.createElement('div');
        signInPage.className = 'sign-in-page';
        
        signInPage.innerHTML = `
            <div class="sign-in-container">
                <div class="sign-in-header">
                    <div class="app-logo">
                        <i class="fas fa-sticky-note"></i>
                    </div>
                    <h1>Welcome to StickyCP9</h1>
                    <p>Your modern sticky notes app with cloud sync</p>
                </div>
                <div class="sign-in-options">
                    <h3>Sign in to sync your notes</h3>
                    <div class="auth-buttons">
                        <button id="google-sign-in" class="auth-btn google-btn">
                            <i class="fab fa-google"></i>
                            <span>Sign in with Google</span>
                        </button>
                        <button id="microsoft-sign-in" class="auth-btn microsoft-btn">
                            <i class="fab fa-microsoft"></i>
                            <span>Sign in with Microsoft</span>
                        </button>
                    </div>
                    <div class="divider">
                        <span>OR</span>
                    </div>
                    <button id="offline-mode-btn" class="auth-btn offline-btn">
                        <i class="fas fa-laptop"></i>
                        <span>Continue in Offline Mode</span>
                    </button>
                </div>
                <div class="sign-in-footer">
                    <p>Notes created in offline mode will be stored locally on this device only.</p>
                </div>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(signInPage);
        
        // Hide app content
        document.querySelector('.app-content').style.display = 'none';
        
        // Add event listeners
        document.getElementById('google-sign-in').addEventListener('click', () => {
            document.getElementById('google-sign-in').disabled = true;
            document.getElementById('google-sign-in').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
            authManager.signInWithGoogle()
                .then(() => {
                    hideSignInPage();
                })
                .catch(error => {
                    console.error('Error signing in with Google', error);
                    document.getElementById('google-sign-in').disabled = false;
                    document.getElementById('google-sign-in').innerHTML = '<i class="fab fa-google"></i> <span>Sign in with Google</span>';
                });
        });
        
        document.getElementById('microsoft-sign-in').addEventListener('click', () => {
            document.getElementById('microsoft-sign-in').disabled = true;
            document.getElementById('microsoft-sign-in').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
            authManager.signInWithMicrosoft()
                .then(() => {
                    hideSignInPage();
                })
                .catch(error => {
                    console.error('Error signing in with Microsoft', error);
                    document.getElementById('microsoft-sign-in').disabled = false;
                    document.getElementById('microsoft-sign-in').innerHTML = '<i class="fab fa-microsoft"></i> <span>Sign in with Microsoft</span>';
                });
        });
          document.getElementById('offline-mode-btn').addEventListener('click', () => {
            localStorage.setItem('sticky-cp9-offline-mode', 'true');
            
            // Dispatch an event to notify the app of offline mode
            const offlineModeEvent = new CustomEvent('offlineModeChanged', {
                detail: { offlineMode: true }
            });
            document.dispatchEvent(offlineModeEvent);
            
            hideSignInPage();
        });
    }
    
    // Hide sign-in page
    function hideSignInPage() {
        const signInPage = document.querySelector('.sign-in-page');
        if (signInPage) {
            // Add animation class for fade out
            signInPage.style.animation = 'fadeOut 0.3s ease forwards';
            
            setTimeout(() => {
                signInPage.remove();
                // Show app content with animation
                const appContent = document.querySelector('.app-content');
                appContent.style.display = 'block';
                appContent.classList.add('visible');
            }, 300);
        }
    }
    // Listen for auth state changes
    document.addEventListener('authStateChanged', function(event) {
        const { isAuthenticated } = event.detail;
        if (isAuthenticated) {
            hideSignInPage();
        }
    });
});
