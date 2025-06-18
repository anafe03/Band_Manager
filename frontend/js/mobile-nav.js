// Mobile Navigation JavaScript for SelfNVest
// Add this to a new file: js/mobile-nav.js

class MobileNavigation {
    constructor() {
        this.mobileMenuToggle = null;
        this.mobileNav = null;
        this.mobileNavOverlay = null;
        this.mobileNavClose = null;
        this.body = document.body;
        this.isOpen = false;
        
        this.init();
    }

    init() {
        // Create mobile navigation elements if they don't exist
        this.createMobileNavigation();
        
        // Get elements
        this.mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        this.mobileNav = document.getElementById('mobile-nav');
        this.mobileNavOverlay = document.getElementById('mobile-nav-overlay');
        this.mobileNavClose = document.getElementById('mobile-nav-close');
        
        // Bind events
        this.bindEvents();
    }

    createMobileNavigation() {
        // Check if mobile nav already exists
        if (document.getElementById('mobile-nav')) {
            return;
        }

        // Get existing navbar
        const navbar = document.querySelector('.navbar');
        if (!navbar) {
            console.warn('Navbar not found, cannot create mobile navigation');
            return;
        }

        // Add mobile menu toggle button to navbar
        const navLinks = navbar.querySelector('.nav-links');
        if (!navLinks) return;

        // Create mobile toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'mobile-menu-toggle';
        toggleButton.id = 'mobile-menu-toggle';
        toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
        
        // Insert toggle button after nav-links
        navLinks.parentNode.insertBefore(toggleButton, navLinks.nextSibling);

        // Create mobile navigation overlay
        const overlay = document.createElement('div');
        overlay.className = 'mobile-nav-overlay';
        overlay.id = 'mobile-nav-overlay';
        document.body.appendChild(overlay);

        // Create mobile navigation menu
        const mobileNav = document.createElement('nav');
        mobileNav.className = 'mobile-nav';
        mobileNav.id = 'mobile-nav';

        // Get logo
        const logo = navbar.querySelector('.logo');
        const logoClone = logo ? logo.cloneNode(true) : null;

        // Create mobile nav header
        const mobileNavHeader = document.createElement('div');
        mobileNavHeader.className = 'mobile-nav-header';
        
        if (logoClone) {
            mobileNavHeader.appendChild(logoClone);
        }
        
        const closeButton = document.createElement('button');
        closeButton.className = 'mobile-nav-close';
        closeButton.id = 'mobile-nav-close';
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        mobileNavHeader.appendChild(closeButton);

        // Create mobile nav links
        const mobileNavLinks = document.createElement('div');
        mobileNavLinks.className = 'mobile-nav-links';

        // Copy existing nav links
        const existingLinks = navLinks.querySelectorAll('a');
        existingLinks.forEach(link => {
            // Skip auth link for now, we'll handle it separately
            if (link.id === 'auth-link') return;
            
            const mobileLink = document.createElement('a');
            mobileLink.href = link.href;
            mobileLink.innerHTML = link.innerHTML;
            mobileNavLinks.appendChild(mobileLink);
        });

        // Create auth section
        const authSection = document.createElement('div');
        authSection.className = 'mobile-auth-section';
        
        const authLink = navLinks.querySelector('#auth-link');
        if (authLink) {
            const mobileAuthLink = document.createElement('a');
            mobileAuthLink.href = authLink.href;
            mobileAuthLink.id = 'mobile-auth-link';
            mobileAuthLink.innerHTML = authLink.innerHTML;
            authSection.appendChild(mobileAuthLink);
        }

        // Assemble mobile nav
        mobileNav.appendChild(mobileNavHeader);
        mobileNav.appendChild(mobileNavLinks);
        mobileNav.appendChild(authSection);
        
        document.body.appendChild(mobileNav);
    }

    bindEvents() {
        // Toggle mobile menu
        this.mobileMenuToggle?.addEventListener('click', () => this.toggleMobileMenu());
        
        // Close mobile menu
        this.mobileNavClose?.addEventListener('click', () => this.closeMobileMenu());
        this.mobileNavOverlay?.addEventListener('click', () => this.closeMobileMenu());
        
        // Close mobile menu when clicking on links
        const mobileLinks = document.querySelectorAll('.mobile-nav-links a, .mobile-auth-section a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => this.closeMobileMenu());
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMobileMenu();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.isOpen) {
                this.closeMobileMenu();
            }
        });

        // Prevent touch scrolling when menu is open
        this.mobileNav?.addEventListener('touchmove', (e) => {
            if (this.isOpen) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    toggleMobileMenu() {
        if (this.isOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        this.mobileNav?.classList.add('active');
        this.mobileNavOverlay?.classList.add('active');
        this.body.classList.add('mobile-menu-open');
        this.isOpen = true;
        
        // Update hamburger icon to X
        const icon = this.mobileMenuToggle?.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-times';
        }

        // Animate menu items
        const menuItems = this.mobileNav?.querySelectorAll('.mobile-nav-links a');
        menuItems?.forEach((item, index) => {
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, index * 100);
        });
    }

    closeMobileMenu() {
        this.mobileNav?.classList.remove('active');
        this.mobileNavOverlay?.classList.remove('active');
        this.body.classList.remove('mobile-menu-open');
        this.isOpen = false;
        
        // Update X icon back to hamburger
        const icon = this.mobileMenuToggle?.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-bars';
        }

        // Reset menu item animations
        const menuItems = this.mobileNav?.querySelectorAll('.mobile-nav-links a');
        menuItems?.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(20px)';
        });
    }

    // Method to update auth links (call this when auth state changes)
    updateAuthLinks(isLoggedIn, userInfo = {}) {
        const authLink = document.getElementById('auth-link');
        const mobileAuthLink = document.getElementById('mobile-auth-link');
        
        if (isLoggedIn) {
            const userName = userInfo.name || 'Profile';
            const profileHtml = `<i class="fas fa-user-circle"></i> ${userName}`;
            const profileHref = 'pages/profile.html';
            
            if (authLink) {
                authLink.innerHTML = profileHtml;
                authLink.href = profileHref;
            }
            
            if (mobileAuthLink) {
                mobileAuthLink.innerHTML = profileHtml;
                mobileAuthLink.href = profileHref;
            }
        } else {
            const loginHtml = '<i class="fas fa-user"></i> Login';
            const loginHref = 'pages/login.html';
            
            if (authLink) {
                authLink.innerHTML = loginHtml;
                authLink.href = loginHref;
            }
            
            if (mobileAuthLink) {
                mobileAuthLink.innerHTML = loginHtml;
                mobileAuthLink.href = loginHref;
            }
        }
    }
}

// Initialize mobile navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mobileNav = new MobileNavigation();
});

// Global function to update auth state (integrate with your auth system)
window.updateMobileAuth = function(isLoggedIn, userInfo = {}) {
    if (window.mobileNav) {
        window.mobileNav.updateAuthLinks(isLoggedIn, userInfo);
    }
};

// Example integration with your existing auth system
// Call this whenever auth state changes:
// window.updateMobileAuth(true, { name: 'John Doe' }); // logged in
// window.updateMobileAuth(false); // logged out