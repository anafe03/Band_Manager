// js/script.js - COMPLETELY CLEAN VERSION - FIXED AUTH

document.addEventListener('DOMContentLoaded', function() {
    // Service Learn More buttons functionality
    const buyingLearnMoreBtn = document.querySelector('.service-item:nth-child(1) .cta-button');
    const sellingLearnMoreBtn = document.querySelector('.service-item:nth-child(2) .cta-button');
    
    if (buyingLearnMoreBtn) {
        buyingLearnMoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'index.html#services';
        });
    }
    
    if (sellingLearnMoreBtn) {
        sellingLearnMoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'index.html#services';
        });
    }
    
    // FAQ Toggle
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        item.addEventListener('click', function() {
            const toggle = this.querySelector('.faq-toggle');
            
            if (toggle.textContent === '+') {
                toggle.textContent = '-';
                
                // Create and show answer element
                const answer = document.createElement('p');
                answer.classList.add('faq-answer');
                answer.textContent = 'This is a placeholder answer. In a real implementation, this would contain the specific answer to the question.';
                
                // Check if answer already exists
                if (!this.querySelector('.faq-answer')) {
                    this.appendChild(answer);
                }
            } else {
                toggle.textContent = '+';
                // Remove answer element if it exists
                const answer = this.querySelector('.faq-answer');
                if (answer) {
                    this.removeChild(answer);
                }
            }
        });
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
    
    // Add a simple animation for the hero section
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        setTimeout(() => {
            heroContent.style.opacity = '0';
            heroContent.style.transition = 'opacity 1s ease';
            
            setTimeout(() => {
                heroContent.style.opacity = '1';
            }, 100);
        }, 500);
    }

    // Enhanced animation for hero section
    const heroTitle = document.querySelector('.hero-content h1');
    const heroParagraph = document.querySelector('.hero-content p');
    const heroButton = document.querySelector('.hero-content .cta-button');
    
    if (heroTitle && heroParagraph && heroButton) {
        // Create a wrapper for the typewriter effect to allow for falling animation
        const originalTitleText = heroTitle.textContent;
        
        // Clear the current title text
        heroTitle.textContent = '';
        
        // Setup initial styles for paragraph and button - hidden and below
        heroParagraph.style.opacity = '0';
        heroParagraph.style.transform = 'translateY(40px)';
        heroParagraph.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        
        heroButton.style.opacity = '0';
        heroButton.style.transform = 'translateY(40px)';
        heroButton.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        
        // Add CSS for the falling effect
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fallIntoPlace {
                0% { transform: translateY(-30px); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
            }
            .word {
                opacity: 0;
                display: inline-block;
            }
            .word.animated {
                animation: fallIntoPlace 0.8s ease forwards;
            }
            .typed-space {
                display: inline-block;
                width: 0.35em;
            }
            .hero-content h1 {
                letter-spacing: 0.5px;
                word-spacing: 4px;
            }
        `;
        document.head.appendChild(style);
        
        // Split the original text into words
        const words = originalTitleText.split(' ');
        
        // Create a container for each word
        words.forEach((word, wordIndex) => {
            const wordSpan = document.createElement('span');
            wordSpan.classList.add('word');
            wordSpan.style.display = 'inline-block';
            wordSpan.textContent = word;
            
            // Add the word to the title
            heroTitle.appendChild(wordSpan);
            
            // Add a space after each word except the last
            if (wordIndex < words.length - 1) {
                const spaceSpan = document.createElement('span');
                spaceSpan.classList.add('typed-space');
                spaceSpan.innerHTML = '&nbsp;';
                heroTitle.appendChild(spaceSpan);
            }
        });
        
        // Get all word spans
        const wordSpans = heroTitle.querySelectorAll('.word');
        
        // Domino effect with falling animation for words
        let currentWordIndex = 0;
        let lastAnimationEnd = 0;
        
        function animateNextWord() {
            if (currentWordIndex < wordSpans.length) {
                const wordSpan = wordSpans[currentWordIndex++];
                
                // Add the animation class to the word
                wordSpan.classList.add('animated');
                
                // If this is the last word, prepare to animate paragraph and button
                if (currentWordIndex === wordSpans.length) {
                    // Calculate when the animation will end (animation duration is 0.8s)
                    lastAnimationEnd = Date.now() + 800;
                    
                    // Wait for the last word to finish falling before showing paragraph
                    setTimeout(() => {
                        // Slide up animation for paragraph - starts exactly when the last word lands
                        heroParagraph.style.opacity = '1';
                        heroParagraph.style.transform = 'translateY(0)';
                        
                        // Delay button animation to follow shortly after paragraph
                        setTimeout(() => {
                            heroButton.style.opacity = '1';
                            heroButton.style.transform = 'translateY(0)';
                        }, 150); // Shorter delay for smoother sequence
                        
                    }, 800); // Wait exactly for the falling animation to complete
                }
                
                // Slow down the animation speed to 400ms between words for a more deliberate effect
                setTimeout(animateNextWord, 400); 
            }
        }
        
        // Start the domino effect animation after a short delay
        setTimeout(animateNextWord, 800);
    }

    // ===== SIMPLE AUTHENTICATION FOR INDEX PAGE =====
    console.log('🏠 Index page auth CLEAN VERSION starting...');
    // initSimpleAuth();
});

// SIMPLE AUTH - FIXED TOKEN NAMES
function initSimpleAuth() {
    console.log('🏠 Simple auth init...');
    
    // Check auth state
    checkAuthState();
    
    // Listen for localStorage changes (FIXED TOKEN NAMES)
    window.addEventListener('storage', function(e) {
        if (e.key === 'supabase_token' || e.key === 'user_email') {
            console.log('🏠 Storage changed, updating...');
            checkAuthState();
        }
    });
    
    // Listen for Supabase auth changes
    if (typeof supabase !== 'undefined') {
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('🏠 Auth state changed:', event);
            if (event === 'SIGNED_IN' && session) {
                // Store with correct names that match login page
                localStorage.setItem('supabase_token', session.access_token);
                localStorage.setItem('user_email', session.user.email);
                localStorage.setItem('user_id', session.user.id);
            } else if (event === 'SIGNED_OUT') {
                localStorage.removeItem('supabase_token');
                localStorage.removeItem('user_email');
                localStorage.removeItem('user_id');
            }
            checkAuthState();
        });
    }
}

// FIND this function in your script.js and REPLACE it with this fixed version
function checkAuthState() {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;
    
    // FIXED: Look for the correct token name
    const token = localStorage.getItem('supabase_token');
    const email = localStorage.getItem('user_email');
    
    console.log('🏠 Auth check:', { hasToken: !!token, hasEmail: !!email, email });
    
    if (token && email) {
        const username = email.split('@')[0];
        console.log('✅ User authenticated:', username);
        
        authLink.innerHTML = `<i class="fas fa-user-circle"></i> Profile`;
        authLink.href = 'pages/profile.html';
        
        addLogout();
    } else {
        console.log('❌ User not authenticated');
        
        // FIXED: Point to login.html instead of auth.html
        authLink.innerHTML = '<i class="fas fa-user"></i> Login';
        authLink.href = 'pages/login.html';  // ← CHANGED FROM pages/auth.html
        
        removeLogout();
    }
}

// ALSO FIND this function and REPLACE it

async function doLogout() {
    if (!confirm('Are you sure you want to logout?')) return;
    
    try {
        if (typeof supabase !== 'undefined') {
            await supabase.auth.signOut();
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    // Clear all auth data
    localStorage.removeItem('supabase_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
    localStorage.removeItem('token_expires_at');
    
    checkAuthState();
    
    // FIXED: Redirect to login.html instead of auth.html
    window.location.href = 'pages/login.html';  // ← CHANGED FROM pages/auth.html
}

function addLogout() {
    const dropdown = document.querySelector('.dropdown-content');
    const authLink = document.getElementById('auth-link');
    
    if (!dropdown || !authLink) return;
    
    // Remove existing
    const existing = dropdown.querySelector('.logout-option');
    if (existing) existing.remove();
    
    // Add logout
    const logoutLink = document.createElement('a');
    logoutLink.href = '#';
    logoutLink.className = 'logout-option';
    logoutLink.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
    logoutLink.style.color = '#dc3545';
    logoutLink.onclick = function(e) {
        e.preventDefault();
        doLogout();
    };
    
    // Add logout after the profile link
    const divider = document.createElement('div');
    divider.style.height = '1px';
    divider.style.background = '#eee';
    divider.style.margin = '8px 0';
    
    dropdown.appendChild(divider);
    dropdown.appendChild(logoutLink);
}

function removeLogout() {
    const logout = document.querySelector('.logout-option');
    if (logout) logout.remove();
    
    // Also remove the divider
    const dividers = document.querySelectorAll('.dropdown-content div');
    dividers.forEach(div => {
        if (div.style.height === '1px') {
            div.remove();
        }
    });
}

