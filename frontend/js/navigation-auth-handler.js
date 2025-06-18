// js/navigation-auth-handler.js - NUCLEAR FIX VERSION
// This version COMPLETELY DISABLES link interception for schedule page

class NavigationAuthHandler {
    constructor() {
        this.protectedRoutes = [
            '/pages/schedule.html',
            '/schedule.html',
            'schedule.html'
        ];
        this.init();
    }

    async init() {
        console.log('🔧 Navigation Auth Handler initializing...');
        console.log('🚨 NUCLEAR MODE: Schedule links will NOT be intercepted');
        
        // Wait for global auth to be ready
        await this.waitForGlobalAuth();
        
        // DISABLED: Do not set up navigation interceptors for schedule
        // this.setupNavigationInterceptors();
        
        console.log('✅ Navigation Auth Handler ready (schedule interception DISABLED)');
    }

    async waitForGlobalAuth() {
        let attempts = 0;
        while ((!window.auth || !window.authState) && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.auth || !window.authState) {
            console.warn('Global auth not loaded - navigation auth will be limited');
        }
    }

    // DISABLED METHOD - No longer intercepts clicks
    setupNavigationInterceptors() {
        console.log('🚨 NUCLEAR MODE: Navigation interception is DISABLED');
        // DO NOTHING - Let schedule links work normally
        return;
    }

    isProtectedRoute(href) {
        if (!href) return false;
        
        return this.protectedRoutes.some(route => {
            return href.includes(route) || href.includes('schedule');
        });
    }

    // This method is no longer called since we disabled interception
    async handleProtectedNavigation(href, linkElement) {
        console.log('🚨 This should not be called in nuclear mode');
        window.location.href = href;
    }

    showLinkLoading(linkElement) {
        // Disabled in nuclear mode
        return;
    }

    hideLinkLoading(linkElement) {
        // Disabled in nuclear mode
        return;
    }

    showAuthRequiredMessage() {
        // Keep this for potential future use
        const notification = document.createElement('div');
        notification.id = 'auth-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff6b6b, #ff5722);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);
            z-index: 10000;
            font-weight: 500;
            font-size: 16px;
            max-width: 350px;
            animation: slideInRight 0.3s ease-out;
            border-left: 4px solid rgba(255, 255, 255, 0.3);
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-lock" style="font-size: 18px;"></i>
                <div>
                    <strong>Login Required</strong><br>
                    <span style="font-size: 14px; opacity: 0.9;">Redirecting to login page...</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            this.removeExistingNotification();
        }, 5000);
    }

    removeExistingNotification() {
        const existing = document.getElementById('auth-notification');
        if (existing && existing.parentNode) {
            existing.parentNode.removeChild(existing);
        }
    }

    // Static method for direct page access (simplified)
    static async checkPageAccess() {
        console.log('🔒 Static page access check...');
        
        // Wait for global auth to be ready
        let attempts = 0;
        while ((!window.auth || window.authState?.isLoading) && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        // Use global auth system
        const isAuthenticated = window.auth?.isAuthenticated() || false;
        
        if (!isAuthenticated) {
            console.log('🔒 Direct access denied, redirecting...');
            
            // Use global auth's redirect handling
            if (window.auth?.requireAuth) {
                window.auth.requireAuth('/pages/login.html');
            } else {
                // Fallback
                localStorage.setItem('auth_redirect_after_login', window.location.pathname);
                setTimeout(() => {
                    window.location.href = '/pages/login.html';
                }, 1000);
            }
            
            return false;
        }
        
        return true;
    }
}

// NUCLEAR MODE: Initialize on all pages INCLUDING schedule page 
// But it won't intercept schedule links anymore
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚨 NUCLEAR MODE: Auto-initializing navigation auth handler (schedule interception DISABLED)');
    window.navigationAuthHandler = new NavigationAuthHandler();
});

// Export for use in other scripts
window.NavigationAuthHandler = NavigationAuthHandler;