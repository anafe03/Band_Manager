// js/authGuard.js - Protection for pages that require authentication
// Include this on pages like profile.html, dashboard.html, etc.

console.log('🔒 Auth Guard loading...');

// Wait for global auth to initialize
async function waitForAuth() {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    
    while (attempts < maxAttempts) {
        // Check if auth system exists
        if (window.auth && window.authState) {
            console.log('🔍 Auth check attempt', attempts, {
                hasAuth: !!window.auth,
                hasAuthState: !!window.authState,
                isLoading: window.authState.isLoading,
                isLoggedIn: window.authState.isLoggedIn
            });
            
            // If auth is not loading, we can proceed
            if (!window.authState.isLoading) {
                console.log('✅ Auth system ready for guard check');
                return true;
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    console.error('❌ Auth system timeout after', attempts, 'attempts');
    return false;
}

// Main auth guard function
async function protectPage() {
    console.log('🔒 Checking page protection...');
    
    // Show loading state
    const body = document.body;
    if (body) {
        body.style.opacity = '0.5';
        body.style.pointerEvents = 'none';
    }
    
    // Wait for auth system to load
    const authLoaded = await waitForAuth();
    
    if (!authLoaded) {
        console.error('❌ Auth system failed to load');
        
        // Try to manually check for Supabase session as fallback
        if (window.supabase) {
            console.log('🔄 Trying fallback auth check...');
            try {
                const { data: { session }, error } = await window.supabase.auth.getSession();
                if (session && session.user) {
                    console.log('✅ Fallback auth successful');
                    // Manually set auth state
                    if (!window.authState) {
                        window.authState = {};
                    }
                    window.authState.isLoggedIn = true;
                    window.authState.user = session.user;
                    window.authState.token = session.access_token;
                    
                    // Allow access
                    if (body) {
                        body.style.opacity = '1';
                        body.style.pointerEvents = 'auto';
                    }
                    initProtectedPage();
                    return;
                }
            } catch (error) {
                console.error('❌ Fallback auth failed:', error);
            }
        }
        
        alert('Authentication system error. Please refresh the page.');
        return;
    }
    
    // Check if user is authenticated
    if (!window.auth.isAuthenticated()) {
        console.log('🔒 User not authenticated, redirecting to login');
        // Store current page for redirect after login
        localStorage.setItem('auth_redirect_after_login', window.location.pathname);
        window.location.href = '/pages/login.html';
        return;
    }
    
    console.log('✅ User authenticated, allowing access');
    
    // Remove loading state
    if (body) {
        body.style.opacity = '1';
        body.style.pointerEvents = 'auto';
    }
    
    // Page is now protected and user is authenticated
    initProtectedPage();
}

// Initialize protected page content
function initProtectedPage() {
    console.log('🎨 Initializing protected page content...');
    
    // Populate user info in the page
    const userEmailElements = document.querySelectorAll('[data-user="email"]');
    const userNameElements = document.querySelectorAll('[data-user="name"]');
    const subscriptionElements = document.querySelectorAll('[data-user="subscription"]');
    
    if (window.authState && window.authState.user) {
        userEmailElements.forEach(el => {
            el.textContent = window.authState.user.email;
        });
        
        const userName = window.authState.user.user_metadata?.full_name ||
                        window.authState.user.email.split('@')[0];
        userNameElements.forEach(el => {
            el.textContent = userName;
        });
    }
    
    if (window.authState && window.authState.subscription) {
        subscriptionElements.forEach(el => {
            el.textContent = window.authState.subscription.status === 'active'
                ? `${window.authState.subscription.plan} (Active)`
                : 'Free Tier';
        });
    }
    
    // Add logout functionality to logout buttons
    const logoutButtons = document.querySelectorAll('[data-action="logout"]');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to log out?')) {
                if (window.auth && window.auth.logout) {
                    window.auth.logout();
                } else {
                    // Fallback logout
                    window.supabase.auth.signOut().then(() => {
                        window.location.href = '/index.html';
                    });
                }
            }
        });
    });
    
    console.log('✅ Protected page initialized');
}

// Auto-run protection
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', protectPage);
} else {
    protectPage();
}