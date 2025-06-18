// js/auth.js - FIXED to be consistent with main page

console.log('🔧 Auth script loading...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 DOM loaded, starting auth...');
    
    // Wait a bit for Supabase to load
    setTimeout(initAuth, 100);
});

async function initAuth() {
    console.log('🔧 Initializing auth...');
    console.log('🔧 Supabase available:', typeof window.supabase !== 'undefined');
    
    if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase not loaded!');
        return;
    }
    
    // Check if we're already logged in via stored token
    const storedToken = localStorage.getItem('supabase_token');
    if (storedToken) {
        console.log('🔧 Found stored token, checking session...');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                console.log('✅ Valid session found, redirecting...');
                window.location.href = '../index.html';
                return;
            } else {
                console.log('❌ Stored token invalid, clearing...');
                clearAuthData();
            }
        } catch (error) {
            console.error('❌ Session check failed:', error);
            clearAuthData();
        }
    }
    
    // Check if we have a fresh Supabase session
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            console.log('✅ Fresh Supabase session found:', session.user.email);
            await handleSuccessfulAuth(session);
            return;
        }
    } catch (error) {
        console.error('❌ Error checking session:', error);
    }
    
    // Setup form handlers
    setupFormHandlers();
    setupOAuthButtons();
}

function clearAuthData() {
    localStorage.removeItem('supabase_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
    localStorage.removeItem('token_expires_at');
}

async function handleSuccessfulAuth(session) {
    console.log('✅ Authentication successful:', session.user.email);
    
    // Store auth data with CONSISTENT names
    localStorage.setItem('supabase_token', session.access_token);
    localStorage.setItem('refresh_token', session.refresh_token);
    localStorage.setItem('user_email', session.user.email);
    localStorage.setItem('user_id', session.user.id);
    localStorage.setItem('token_expires_at', session.expires_at);
    
    console.log('💾 Auth data stored');
    
    // Show success message
    const status = document.getElementById('login-status') || document.getElementById('signup-status');
    if (status) {
        status.innerHTML = '<span style="color: green;">✅ Success! Redirecting...</span>';
    }
    
    // Redirect to home page
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 1000);
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
    
    // Password reset form
    const resetForm = document.getElementById('reset-form');
    if (resetForm) {
        resetForm.addEventListener('submit', handlePasswordReset);
        console.log('✅ Password reset form handler attached');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    console.log('🔧 Login form submitted');
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const status = document.getElementById('login-status');
    
    if (!email || !password) {
        status.innerHTML = '<span style="color: red;">❌ Please fill in all fields</span>';
        return;
    }
    
    console.log('🔧 Attempting login for:', email);
    status.innerHTML = '<span style="color: blue;">🔄 Signing in...</span>';
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('❌ Login error:', error.message);
            
            let errorMessage = error.message;
            if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Please check your email and click the confirmation link first.';
            } else if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Invalid email or password. Please try again.';
            }
            
            status.innerHTML = `<span style="color: red;">❌ ${errorMessage}</span>`;
            return;
        }
        
        console.log('✅ Login successful:', data.user.email);
        await handleSuccessfulAuth(data.session);
        
    } catch (error) {
        console.error('❌ Login exception:', error);
        status.innerHTML = '<span style="color: red;">❌ Login failed. Please try again.</span>';
    }
}

async function handleSignup(e) {
    e.preventDefault();
    console.log('🔧 Signup form submitted');
    
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const fullName = document.getElementById('full-name').value.trim();
    const status = document.getElementById('signup-status');
    
    // Validation
    if (!email || !password || !confirmPassword) {
        status.innerHTML = '<span style="color: red;">❌ Please fill in all fields</span>';
        return;
    }
    
    if (password !== confirmPassword) {
        status.innerHTML = '<span style="color: red;">❌ Passwords do not match</span>';
        return;
    }
    
    if (password.length < 6) {
        status.innerHTML = '<span style="color: red;">❌ Password must be at least 6 characters</span>';
        return;
    }
    
    console.log('🔧 Attempting signup for:', email);
    status.innerHTML = '<span style="color: blue;">🔄 Creating account...</span>';
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName
                },
                emailRedirectTo: `${window.location.origin}/pages/auth.html?verified=true`
            }
        });
        
        if (error) {
            console.error('❌ Signup error:', error.message);
            status.innerHTML = `<span style="color: red;">❌ ${error.message}</span>`;
            return;
        }
        
        if (data.user && !data.session) {
            // Email confirmation required
            console.log('📧 Email confirmation required for:', email);
            status.innerHTML = `
                <span style="color: green;">✅ Account created! Please check your email for a confirmation link.</span>
                <br><br>
                <button onclick="resendConfirmation('${email}')" style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    📧 Resend Confirmation Email
                </button>
            `;
        } else if (data.session) {
            // Auto-confirmed, signed in
            console.log('✅ Signup successful with auto-signin:', data.user.email);
            await handleSuccessfulAuth(data.session);
        }
        
    } catch (error) {
        console.error('❌ Signup exception:', error);
        status.innerHTML = '<span style="color: red;">❌ Signup failed. Please try again.</span>';
    }
}

async function handlePasswordReset(e) {
    e.preventDefault();
    console.log('🔧 Password reset requested');
    
    const email = document.getElementById('reset-email').value.trim();
    const status = document.getElementById('reset-status');
    
    if (!email) {
        status.innerHTML = '<span style="color: red;">❌ Please enter your email address</span>';
        return;
    }
    
    console.log('🔧 Sending password reset for:', email);
    status.innerHTML = '<span style="color: blue;">🔄 Sending reset email...</span>';
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/pages/auth.html?reset=true`
        });
        
        if (error) {
            console.error('❌ Password reset error:', error.message);
            status.innerHTML = `<span style="color: red;">❌ ${error.message}</span>`;
            return;
        }
        
        console.log('✅ Password reset email sent');
        status.innerHTML = '<span style="color: green;">✅ Password reset email sent! Check your inbox.</span>';
        
    } catch (error) {
        console.error('❌ Password reset exception:', error);
        status.innerHTML = '<span style="color: red;">❌ Failed to send reset email. Please try again.</span>';
    }
}

async function resendConfirmation(email) {
    console.log('🔧 Resending confirmation for:', email);
    
    try {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
                emailRedirectTo: `${window.location.origin}/pages/auth.html?verified=true`
            }
        });
        
        if (error) {
            console.error('❌ Resend error:', error.message);
            alert('Failed to resend confirmation email: ' + error.message);
            return;
        }
        
        console.log('✅ Confirmation email resent');
        alert('Confirmation email sent! Please check your inbox.');
        
    } catch (error) {
        console.error('❌ Resend exception:', error);
        alert('Failed to resend confirmation email. Please try again.');
    }
}

function setupOAuthButtons() {
    const googleBtn = document.getElementById('google-signin');
    const githubBtn = document.getElementById('github-signin');
    
    if (googleBtn) {
        googleBtn.addEventListener('click', () => handleOAuth('google'));
        console.log('✅ Google OAuth button setup');
    }
    
    if (githubBtn) {
        githubBtn.addEventListener('click', () => handleOAuth('github'));
        console.log('✅ GitHub OAuth button setup');
    }
}

async function handleOAuth(provider) {
    console.log('🔧 OAuth login:', provider);
    
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: `${window.location.origin}/index.html`
            }
        });
        
        if (error) {
            console.error('❌ OAuth error:', error);
            alert('OAuth login failed: ' + error.message);
        }
    } catch (error) {
        console.error('❌ OAuth exception:', error);
        alert('OAuth login failed. Please try again.');
    }
}

// Handle URL parameters (for email confirmation, password reset, etc.)
function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('verified') === 'true') {
        const status = document.getElementById('login-status');
        if (status) {
            status.innerHTML = '<span style="color: green;">✅ Email verified! You can now sign in.</span>';
        }
    }
    
    if (urlParams.get('reset') === 'true') {
        // Switch to login tab and show message
        const loginTab = document.querySelector('[data-tab="login"]');
        if (loginTab) {
            loginTab.click();
        }
        
        const status = document.getElementById('login-status');
        if (status) {
            status.innerHTML = '<span style="color: blue;">ℹ️ Please enter your new password to sign in.</span>';
        }
    }
}

// Handle URL parameters when page loads
document.addEventListener('DOMContentLoaded', handleUrlParams);