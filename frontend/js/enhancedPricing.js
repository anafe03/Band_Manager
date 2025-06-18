// Enhanced pricing system with dynamic buttons and global auth integration
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Enhanced pricing system loading...');
    
    // Wait for global auth to initialize before updating buttons
    const checkAuth = setInterval(() => {
        if (window.authState && !window.authState.isLoading) {
            clearInterval(checkAuth);
            initializePricingButtons();
            updatePricingButtons();
        }
    }, 100);
    
    // Listen for auth state changes
    document.addEventListener('authStateChanged', function(event) {
        console.log('🔄 Auth state changed, updating pricing buttons');
        updatePricingButtons();
    });
});

function initializePricingButtons() {
    console.log('🔧 Initializing pricing buttons...');
    
    // Find pricing buttons and add IDs if they don't exist
    const priceCards = document.querySelectorAll('.price-card');
    
    priceCards.forEach(card => {
        const button = card.querySelector('button.cta-button, .cta-button');
        if (button) {
            // Determine plan type
            const isPremium = card.querySelector('h3').textContent.includes('$999');
            const isStandard = card.querySelector('h3').textContent.includes('$249');
            
            if (isPremium) {
                button.id = 'premium-button';
                button.onclick = () => handlePricingClick('premium');
            } else if (isStandard) {
                button.id = 'standard-button';
                button.onclick = () => handlePricingClick('standard');
            }
            
            // Remove any existing href from parent links
            const parentLink = button.closest('a');
            if (parentLink) {
                parentLink.href = 'javascript:void(0)';
            }
        }
    });
    
    console.log('✅ Pricing buttons initialized');
}

function handlePricingClick(plan) {
    console.log(`🛒 Handling pricing click for plan: ${plan}`);
    
    // Check if user is logged in
    if (window.auth && window.auth.isAuthenticated()) {
        const subscription = window.authState.subscription;
        const currentPlan = subscription?.plan || 'free';
        const currentStatus = subscription?.status || 'inactive';
        
        console.log(`📊 Current subscription: ${currentPlan} (${currentStatus})`);
        
        // Check if user already owns this plan
        if (currentStatus === 'active') {
            if (plan === 'standard' && (currentPlan === 'standard' || currentPlan === 'premium')) {
                alert('You already own this plan or a higher tier!');
                return;
            }
            if (plan === 'premium' && currentPlan === 'premium') {
                alert('You already own this plan!');
                return;
            }
        }
        
        // User can purchase - go to Stripe
        console.log(`💳 Redirecting to Stripe checkout for ${plan}`);
        window.auth.createCheckoutSession(plan);
    } else {
        // Not logged in - go to signup with plan parameter
        console.log(`📝 Redirecting to signup with plan: ${plan}`);
        window.location.href = `pages/signup.html?plan=${plan}`;
    }
}

function updatePricingButtons() {
    console.log('🔄 Updating pricing buttons based on auth state');
    
    const standardButton = document.getElementById('standard-button');
    const premiumButton = document.getElementById('premium-button');
    
    if (!window.auth || !window.auth.isAuthenticated()) {
        // Not logged in - show "Get Started"
        updateButtonState(standardButton, 'Get Started', 'default');
        updateButtonState(premiumButton, 'Get Started', 'default');
        console.log('👤 User not logged in - showing "Get Started"');
        return;
    }
    
    const subscription = window.authState.subscription;
    const currentPlan = subscription?.plan || 'free';
    const currentStatus = subscription?.status || 'inactive';
    
    console.log(`📊 Updating buttons for user: ${currentPlan} (${currentStatus})`);
    
    // Update standard button ($249)
    if (standardButton) {
        if (currentStatus === 'active' && (currentPlan === 'standard' || currentPlan === 'premium')) {
            updateButtonState(standardButton, '<i class="fas fa-check"></i> Owned', 'owned');
        } else {
            updateButtonState(standardButton, 'Get Started', 'default');
        }
    }
    
    // Update premium button ($999)
    if (premiumButton) {
        if (currentStatus === 'active' && currentPlan === 'premium') {
            updateButtonState(premiumButton, '<i class="fas fa-check"></i> Owned', 'owned');
        } else if (currentStatus === 'active' && currentPlan === 'standard') {
            updateButtonState(premiumButton, '<i class="fas fa-arrow-up"></i> Upgrade', 'upgrade');
        } else {
            updateButtonState(premiumButton, 'Get Started', 'default');
        }
    }
    
    console.log('✅ Pricing buttons updated');
}

function updateButtonState(button, text, state) {
    if (!button) return;
    
    button.innerHTML = text;
    
    // Reset classes
    button.className = 'cta-button dark';
    button.disabled = false;
    button.style.cursor = 'pointer';
    
    // Apply state-specific styling
    switch(state) {
        case 'owned':
            button.className += ' owned-button';
            button.disabled = true;
            button.style.cursor = 'not-allowed';
            button.style.backgroundColor = '#28a745';
            button.style.opacity = '0.8';
            break;
        case 'upgrade':
            button.className += ' upgrade-button';
            button.style.backgroundColor = '#007bff';
            break;
        case 'default':
        default:
            // Keep default styling
            break;
    }
}

// Enhanced "Get Started" button handler for other parts of the site
function handleGetStarted() {
    console.log('🚀 Handle Get Started clicked');
    
    if (window.auth && window.auth.isAuthenticated()) {
        // User is logged in, go to pricing section
        const pricingSection = document.getElementById('pricing');
        if (pricingSection) {
            pricingSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.location.href = '#pricing';
        }
    } else {
        // User not logged in, go to signup
        window.location.href = 'pages/signup.html';
    }
}

// Handle signup form submission with plan parameter
document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        console.log('📝 Signup form detected, adding enhanced handlers');
        
        // Get plan from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const selectedPlan = urlParams.get('plan');
        
        if (selectedPlan) {
            console.log(`📋 Plan parameter detected: ${selectedPlan}`);
            
            // Store plan for after signup
            localStorage.setItem('signup_selected_plan', selectedPlan);
            
            // Update UI to show selected plan
            const planDisplay = document.getElementById('selected-plan-display');
            if (planDisplay) {
                planDisplay.textContent = selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1);
            }
        }
    }
});

// Listen for successful signup to handle plan redirect
document.addEventListener('authStateChanged', function(event) {
    const { event: authEvent, session } = event.detail;
    
    if (authEvent === 'SIGNED_IN' && session) {
        console.log('✅ User signed in, checking for plan selection');
        
        const selectedPlan = localStorage.getItem('signup_selected_plan');
        if (selectedPlan && (selectedPlan === 'standard' || selectedPlan === 'premium')) {
            console.log(`🛒 Redirecting to Stripe for plan: ${selectedPlan}`);
            
            // Clear the stored plan
            localStorage.removeItem('signup_selected_plan');
            
            // Wait a moment for auth state to fully initialize
            setTimeout(() => {
                if (window.auth && window.auth.createCheckoutSession) {
                    window.auth.createCheckoutSession(selectedPlan);
                } else {
                    console.error('❌ Global auth not available for checkout');
                    // Fallback: redirect to profile
                    window.location.href = '/pages/profile.html';
                }
            }, 1000);
        } else if (window.location.pathname.includes('signup') || window.location.pathname.includes('login')) {
            // No plan selected, redirect to profile after login/signup
            console.log('📄 No plan selected, redirecting to profile');
            setTimeout(() => {
                window.location.href = '/pages/profile.html';
            }, 1000);
        }
    }
});

// Export functions for global use
window.pricingSystem = {
    handlePricingClick,
    updatePricingButtons,
    handleGetStarted
};

console.log('✅ Enhanced pricing system loaded');