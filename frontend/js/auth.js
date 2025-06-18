// js/auth.js - Updated to work with Global Auth Manager

console.log('🔧 Auth script loading...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 DOM loaded');
    setTimeout(initAuth, 100);
});

async function initAuth() {
    console.log('🔧 Initializing auth forms...');
    
    if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase not loaded!');
        return;
    }
    
    // Setup form handlers
    setupFormHandlers();
}

function setupFormHandlers() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('✅ Login form handler attached');
    }
    
    // Signup form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
        console.log('✅ Signup form handler attached');
    }
    
    // Google signin
    const googleBtn = document.getElementById('google-signin');
    if (googleBtn) {
        googleBtn.addEventListener('click', handleGoogleSignin);
        console.log('✅ Google signin handler attached');
    }
    
    // GitHub signin
    const githubBtn = document.getElementById('github-signin');
    if (githubBtn) {
        githubBtn.addEventListener('click', handleGithubSignin);
        console.log('✅ GitHub signin handler attached');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    console.log('🔧 Login attempt');
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const status = document.getElementById('login-status');
    const spinner = document.querySelector('.spinner');
    const btnText = document.querySelector('.btn-text');
    
    if (!email || !password) {
        status.innerHTML = '<span style="color: red;">❌ Please fill in all fields</span>';
        return;
    }
    
    // Show loading
    if (spinner) spinner.style.display = 'inline-block';
    if (btnText) btnText.textContent = 'Signing in...';
    status.innerHTML = '<span style="color: blue;">🔄 Signing in...</span>';
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('❌ Login error:', error);
            
            // Always reset button state on error
            resetLoginButton();
            
            let errorMessage = error.message;
            if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Please check your email and click the confirmation link first.';
            } else if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Invalid email or password. Please check your credentials and try again.';
            }
            
            status.innerHTML = `<span style="color: red;">❌ ${errorMessage}</span>`;
            return;
        }
        
        if (data.session) {
            console.log('✅ Login successful!');
            
            status.innerHTML = '<span style="color: green;">✅ Login successful! Redirecting...</span>';
            
            // Let global auth handle the state update
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Check if there's a redirect URL stored
            const redirectPath = localStorage.getItem('auth_redirect_after_login');
            if (redirectPath) {
                localStorage.removeItem('auth_redirect_after_login');
                window.location.href = redirectPath;
            } else {
                // Default redirect to homepage
                window.location.href = '/index.html';
            }
        }
        
    } catch (error) {
        console.error('❌ Login exception:', error);
        
        // Always reset button state on exception
        resetLoginButton();
        
        status.innerHTML = '<span style="color: red;">❌ Login failed. Please try again.</span>';
    }

    // Helper function to reset button state
    function resetLoginButton() {
        const spinner = document.querySelector('.spinner');
        const btnText = document.querySelector('.btn-text');
        const loginBtn = document.getElementById('login-btn');
        
        if (spinner) spinner.style.display = 'none';
        if (btnText) btnText.textContent = 'Sign In';
        if (loginBtn) loginBtn.disabled = false;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    console.log('🔧 Signup attempt');
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const fullName = document.getElementById('name')?.value.trim() || '';
    const status = document.getElementById('signup-status');
    
    if (!email || !password) {
        status.innerHTML = '<span style="color: red;">❌ Please fill in all fields</span>';
        return;
    }
    
    if (password.length < 8) {
        status.innerHTML = '<span style="color: red;">❌ Password must be at least 8 characters</span>';
        return;
    }
    
    status.innerHTML = '<span style="color: blue;">🔄 Creating account...</span>';
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });
        
        if (error) {
            console.error('❌ Signup error:', error);
            status.innerHTML = `<span style="color: red;">❌ ${error.message}</span>`;
            return;
        }
        
        if (data.user && !data.session) {
            // Email confirmation required
            status.innerHTML = `
                <span style="color: green;">✅ Account created! Please check your email for a confirmation link.</span>
                <br><br>
                <p style="font-size: 14px; color: #666; margin-top: 10px;">
                    After confirming your email, you can sign in.
                </p>
            `;
        } else if (data.session) {
            // Auto-confirmed - redirect to Stripe selection
            console.log('✅ Signup successful with auto-signin');
            
            status.innerHTML = '<span style="color: green;">✅ Account created! Choose your plan...</span>';
            
            // Wait a moment for auth state to update
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Redirect to pricing/plan selection
            window.location.href = '/index.html#pricing';
        }
        
    } catch (error) {
        console.error('❌ Signup exception:', error);
        status.innerHTML = '<span style="color: red;">❌ Signup failed. Please try again.</span>';
    }
}

async function handleGoogleSignin() {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/index.html#pricing`
            }
        });
        
        if (error) {
            console.error('❌ Google signin error:', error);
            alert('Google login error: ' + error.message);
        }
    } catch (error) {
        console.error('❌ Google signin exception:', error);
        alert('Google login failed. Please try again.');
    }
}

async function handleGithubSignin() {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/index.html#pricing`
            }
        });
        
        if (error) {
            console.error('❌ GitHub signin error:', error);
            alert('GitHub login error: ' + error.message);
        }
    } catch (error) {
        console.error('❌ GitHub signin exception:', error);
        alert('GitHub login failed. Please try again.');
    }
}

// Export functions for global use if needed
window.authForms = {
    handleLogin,
    handleSignup,
    handleGoogleSignin,
    handleGithubSignin
};