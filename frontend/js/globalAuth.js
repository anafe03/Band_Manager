// js/globalAuth.js - Global Authentication Manager
// This script should be loaded on EVERY page after supabaseClient.js

console.log('🔧 Global Auth Manager loading...');

// Global auth state object
window.authState = {
    isLoggedIn: false,
    user: null,
    token: null,
    subscription: null,
    isLoading: true
};

// Global auth functions
window.auth = {
    // Get current user with fresh session check
    getCurrentUser: async function() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('❌ Session check error:', error);
                return null;
            }
            
            if (session && session.user) {
                // Update global state
                window.authState.isLoggedIn = true;
                window.authState.user = session.user;
                window.authState.token = session.access_token;
                
                // Update localStorage with fresh data
                localStorage.setItem('supabase_token', session.access_token);
                localStorage.setItem('user_email', session.user.email);
                localStorage.setItem('user_id', session.user.id);
                
                // Get subscription status from user metadata
                const userMetadata = session.user.user_metadata || {};
                window.authState.subscription = {
                    status: userMetadata.subscription_status || localStorage.getItem('user_subscription_status') || 'free',
                    plan: userMetadata.subscription_plan || localStorage.getItem('user_tier') || 'free',
                    tier: userMetadata.subscription_tier || localStorage.getItem('user_tier') || 'free'
                };
                
                // Update localStorage subscription data
                localStorage.setItem('user_subscription_status', window.authState.subscription.status);
                localStorage.setItem('user_tier', window.authState.subscription.tier);
                
                console.log('✅ User authenticated:', session.user.email);
                return session.user;
            } else {
                // No valid session
                this.clearAuthState();
                return null;
            }
        } catch (error) {
            console.error('❌ Auth check failed:', error);
            this.clearAuthState();
            return null;
        }
    },

    // Check if user is authenticated
    isAuthenticated: function() {
        return window.authState.isLoggedIn && window.authState.token;
    },

    // Require authentication - redirect to login if not logged in
    requireAuth: function(redirectTo = '/pages/login.html') {
        if (!this.isAuthenticated()) {
            console.log('🔒 Authentication required, redirecting to login');
            // Store current page to redirect back after login
            localStorage.setItem('auth_redirect_after_login', window.location.pathname);
            window.location.href = redirectTo;
            return false;
        }
        return true;
    },

    // Clear all auth state
    clearAuthState: function() {
        window.authState.isLoggedIn = false;
        window.authState.user = null;
        window.authState.token = null;
        window.authState.subscription = null;
        
        // Clear localStorage
        localStorage.removeItem('supabase_token');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_subscription_status');
        localStorage.removeItem('user_tier');
        
        console.log('🧹 Auth state cleared');
    },

    // Logout function
    logout: async function() {
        try {
            await supabase.auth.signOut();
            this.clearAuthState();
            
            // Redirect to home page
            window.location.href = '/index.html';
        } catch (error) {
            console.error('❌ Logout error:', error);
            // Clear state anyway
            this.clearAuthState();
            window.location.href = '/index.html';
        }
    },

    // Refresh token if needed
    refreshToken: async function() {
        try {
            const { data, error } = await supabase.auth.refreshSession();
            
            if (error) {
                console.error('❌ Token refresh failed:', error);
                this.clearAuthState();
                return false;
            }
            
            if (data.session) {
                window.authState.token = data.session.access_token;
                localStorage.setItem('supabase_token', data.session.access_token);
                console.log('✅ Token refreshed');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Token refresh error:', error);
            return false;
        }
    },

    // Create Stripe checkout session with detailed debugging
    createCheckoutSession: async function(planType) {
        if (!this.isAuthenticated()) {
            alert('Please log in first');
            return;
        }

        try {
            console.log('🛒 Creating checkout for plan:', planType);
            console.log('👤 User state:', {
                id: window.authState.user?.id,
                email: window.authState.user?.email,
                token: window.authState.token?.substring(0, 20) + '...'
            });
            
            const requestBody = {
                plan: planType,
                user_id: window.authState.user.id
            };
            console.log('📤 Request body:', requestBody);
            
            const response = await fetch('/api/stripe/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.authState.token}`
                },
                body: JSON.stringify(requestBody)
            });
            
            console.log('📡 Response details:');
            console.log('  - Status:', response.status, response.statusText);
            console.log('  - Headers:', Object.fromEntries(response.headers.entries()));
            console.log('  - Content-Type:', response.headers.get('content-type'));
            console.log('  - OK:', response.ok);
            
            // Get the raw response text first
            const responseText = await response.text();
            console.log('📄 Raw response text:', responseText);
            console.log('📄 Response length:', responseText.length);
            
            // Check if response is empty
            if (!responseText.trim()) {
                console.error('🚨 Server returned completely empty response');
                throw new Error('Server returned empty response - check server logs');
            }
            
            // Check if response looks like HTML (server error page)
            if (responseText.trim().startsWith('<')) {
                console.error('🚨 Server returned HTML instead of JSON');
                console.log('🔍 HTML content:', responseText.substring(0, 200));
                throw new Error('Server error - returned HTML page instead of JSON');
            }
            
            // Try to parse as JSON
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('✅ Parsed JSON successfully:', data);
            } catch (parseError) {
                console.error('❌ JSON parse failed:', parseError);
                console.log('🔍 Failed to parse:', responseText.substring(0, 100));
                throw new Error(`Invalid JSON response: ${parseError.message}`);
            }
            
            // Handle HTTP error status codes
            if (!response.ok) {
                console.error('❌ HTTP error:', response.status, data);
                const errorMessage = data?.detail || data?.error || data?.message || `HTTP ${response.status} error`;
                
                // Handle specific error cases
                if (response.status === 401 || response.status === 403) {
                    console.log('🔄 Authentication issue, attempting token refresh...');
                    const refreshed = await this.refreshToken();
                    if (refreshed) {
                        console.log('✅ Token refreshed, retrying checkout...');
                        return this.createCheckoutSession(planType);
                    } else {
                        throw new Error('Authentication expired. Please log in again.');
                    }
                }
                
                throw new Error(errorMessage);
            }
            
            // Handle successful response
            if (data.success && data.checkout_url) {
                console.log('✅ Checkout successful, redirecting to:', data.checkout_url);
                window.location.href = data.checkout_url;
            } else if (data.checkout_url) {
                // Some APIs don't include success field
                console.log('✅ Found checkout URL, redirecting to:', data.checkout_url);
                window.location.href = data.checkout_url;
            } else {
                console.error('❌ Missing checkout URL in response:', data);
                throw new Error(data.error || data.detail || 'No checkout URL received from server');
            }
            
        } catch (error) {
            console.error('❌ Checkout error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            // Show user-friendly error message
            let userMessage = 'Error connecting to payment system. Please try again.';
            
            if (error.message.includes('Authentication') || error.message.includes('log in')) {
                userMessage = 'Please log in again to continue.';
                setTimeout(() => {
                    this.logout();
                }, 2000);
            } else if (error.message.includes('Invalid plan')) {
                userMessage = 'Invalid plan selected. Please refresh the page and try again.';
            } else if (error.message.includes('empty response')) {
                userMessage = 'Server error. Please check your connection and try again.';
            } else if (error.message.includes('HTML')) {
                userMessage = 'Server configuration error. Please contact support.';
            }
            
            alert(`Checkout Error: ${userMessage}\n\nTechnical details: ${error.message}`);
        }
    },

    // Initialize auth state
    init: async function() {
        console.log('🔧 Initializing global auth...');
        window.authState.isLoading = true;
        
        try {
            await this.getCurrentUser();
            window.authState.isLoading = false;
            
            // Update UI
            this.updateGlobalUI();
            
            // Handle redirect after login
            this.handlePostLoginRedirect();
            
            console.log('✅ Global auth initialized');
            console.log('📊 Auth State:', window.authState);
            
            // Dispatch custom event for other scripts
            window.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: window.authState
            }));
            
        } catch (error) {
            console.error('❌ Auth initialization failed:', error);
            window.authState.isLoading = false;
        }
    },

    // Update UI elements across the site
    updateGlobalUI: function() {
        // Update auth links in navigation
        const authLink = document.getElementById('auth-link');
        if (authLink) {
            if (this.isAuthenticated()) {
                const subscription = window.authState.subscription;
                if (subscription && subscription.status === 'active') {
                    authLink.innerHTML = `<i class="fas fa-user-check"></i> Profile`;
                } else {
                    authLink.innerHTML = `<i class="fas fa-user"></i> Profile (Free)`;
                }
                authLink.href = '/pages/profile.html';
            } else {
                authLink.innerHTML = `<i class="fas fa-user"></i> Login`;
                authLink.href = '/pages/login.html';
            }
        }

        // Update any logout buttons
        const logoutButtons = document.querySelectorAll('[data-auth="logout"]');
        logoutButtons.forEach(btn => {
            btn.style.display = this.isAuthenticated() ? 'block' : 'none';
            btn.onclick = () => this.logout();
        });

        // Update pricing buttons if on homepage
        this.updatePricingButtons();

        // Show/hide auth-protected content
        const authProtected = document.querySelectorAll('[data-auth-required="true"]');
        authProtected.forEach(element => {
            element.style.display = this.isAuthenticated() ? 'block' : 'none';
        });

        const authHidden = document.querySelectorAll('[data-auth-hidden="true"]');
        authHidden.forEach(element => {
            element.style.display = this.isAuthenticated() ? 'none' : 'block';
        });
    },

    // Update pricing buttons for logged-in users
    updatePricingButtons: function() {
        if (!this.isAuthenticated()) return;

        const standardButton = document.querySelector('.price-card.featured .cta-button');
        const premiumButton = document.querySelector('.price-card:not(.featured) .cta-button');
        
        if (standardButton) {
            const parentLink = standardButton.closest('a');
            if (parentLink) parentLink.href = 'javascript:void(0)';
            
            standardButton.onclick = (e) => {
                e.preventDefault();
                this.createCheckoutSession('standard');
            };
        }
        
        if (premiumButton) {
            const parentLink = premiumButton.closest('a');
            if (parentLink) parentLink.href = 'javascript:void(0)';
            
            premiumButton.onclick = (e) => {
                e.preventDefault();
                this.createCheckoutSession('premium');
            };
        }

        console.log('💳 Pricing buttons updated for authenticated user');
    },

    handlePostLoginRedirect: function() {
        console.log('🛑 Post-login redirect DISABLED for schedule page');
        // Clear any stored redirects but don't actually redirect
        localStorage.removeItem('auth_redirect_after_login');
    
    }
    
};

// Add test functions for debugging
window.auth.testSimpleEndpoint = async function() {
    try {
        console.log('🧪 Testing simple endpoint...');
        const response = await fetch('/api/stripe/simple-test');
        const text = await response.text();
        console.log('📄 Simple test raw response:', text);
        
        try {
            const data = JSON.parse(text);
            console.log('✅ Simple test JSON:', data);
            return data;
        } catch (e) {
            console.error('❌ Simple test parse error:', e);
            return { error: 'Parse failed', raw: text };
        }
    } catch (error) {
        console.error('❌ Simple test failed:', error);
        return { error: error.message };
    }
};

window.auth.testAuthEndpoint = async function() {
    try {
        console.log('🔐 Testing auth endpoint...');
        const response = await fetch('/api/auth/test', {
            headers: {
                'Authorization': `Bearer ${window.authState.token}`
            }
        });
        const text = await response.text();
        console.log('📄 Auth test raw response:', text);
        
        try {
            const data = JSON.parse(text);
            console.log('✅ Auth test JSON:', data);
            return data;
        } catch (e) {
            console.error('❌ Auth test parse error:', e);
            return { error: 'Parse failed', raw: text };
        }
    } catch (error) {
        console.error('❌ Auth test failed:', error);
        return { error: error.message };
    }
};

// Set up auth state change listener from Supabase
if (typeof supabase !== 'undefined') {
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state change:', event);
        
        if (event === 'SIGNED_IN' && session) {
            await window.auth.getCurrentUser();
            window.auth.updateGlobalUI();
        } else if (event === 'SIGNED_OUT') {
            window.auth.clearAuthState();
            window.auth.updateGlobalUI();
        }
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { event, session, authState: window.authState }
        }));
    });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => window.auth.init(), 100);
    });
} else {
    // DOM already loaded
    setTimeout(() => window.auth.init(), 100);
}

// Export for other scripts
window.globalAuth = window.auth;