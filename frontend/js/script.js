// Fixed JavaScript for TourSync index page

// Get Started function
function handleGetStarted() {
    console.log('Get Started clicked - scrolling to pricing');
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Mobile navigation functions
function toggleMobileNav() {
    console.log('Toggle mobile nav called');
    const mobileNav = document.querySelector('.mobile-nav');
    const overlay = document.querySelector('.mobile-nav-overlay');
    
    if (mobileNav && overlay) {
        const isActive = mobileNav.classList.contains('active');
        
        if (isActive) {
            // Close menu
            mobileNav.classList.remove('active');
            overlay.classList.remove('active');
            document.body.classList.remove('mobile-menu-open');
            console.log('Mobile nav closed');
        } else {
            // Open menu
            mobileNav.classList.add('active');
            overlay.classList.add('active');
            document.body.classList.add('mobile-menu-open');
            console.log('Mobile nav opened');
        }
    } else {
        console.error('Mobile nav elements not found');
    }
}

function closeMobileNav() {
    console.log('Close mobile nav called');
    const mobileNav = document.querySelector('.mobile-nav');
    const overlay = document.querySelector('.mobile-nav-overlay');
    
    if (mobileNav) mobileNav.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.classList.remove('mobile-menu-open');
    console.log('Mobile nav closed');
}

// Expose mobile functions globally
window.toggleMobileNav = toggleMobileNav;
window.closeMobileNav = closeMobileNav;

// Main functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('TourSync DOM loaded');
    
    // Setup mobile navigation
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const mobileClose = document.querySelector('.mobile-nav-close');
    const overlay = document.querySelector('.mobile-nav-overlay');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileNav);
        console.log('Mobile toggle listener attached');
    }
    
    if (mobileClose) {
        mobileClose.addEventListener('click', closeMobileNav);
        console.log('Mobile close listener attached');
    }
    
    if (overlay) {
        overlay.addEventListener('click', closeMobileNav);
        console.log('Overlay click listener attached');
    }
    
    // Close menu when clicking on nav links
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', closeMobileNav);
    });
    
    // Wait for auth to load, then setup buttons
    setTimeout(() => {
        const premiumBtn = document.getElementById('premium-button');
        const standardBtn = document.getElementById('standard-button');
        
        if (premiumBtn) {
            premiumBtn.addEventListener('click', function() {
                // Check if user is authenticated
                if (window.auth && window.auth.isAuthenticated()) {
                    console.log('User authenticated, starting checkout for premium');
                    window.auth.createCheckoutSession('premium');
                } else {
                    console.log('User not authenticated, redirecting to login');
                    localStorage.setItem('selected_plan', 'premium');
                    window.location.href = 'pages/login.html';
                }
            });
        }
        
        if (standardBtn) {
            standardBtn.addEventListener('click', function() {
                // Check if user is authenticated
                if (window.auth && window.auth.isAuthenticated()) {
                    console.log('User authenticated, starting checkout for standard');
                    window.auth.createCheckoutSession('standard');
                } else {
                    console.log('User not authenticated, redirecting to login');
                    localStorage.setItem('selected_plan', 'standard');
                    window.location.href = 'pages/login.html';
                }
            });
        }
    }, 2000);
    
    // Tour calculator functionality (FIXED)
    const slider = document.getElementById('savings-slider');
    const currentSavings = document.getElementById('current-savings');
    const totalSavings = document.getElementById('total-savings');
    const tourSize = document.getElementById('tour-size');
    const savingsHours = document.getElementById('savings-hours');
    const sliderThumb = document.querySelector('.slider-thumb');
    
    if (slider && currentSavings && totalSavings) {
        // Set initial position of the custom thumb
        updateThumbPosition();
        
        // Update values when slider moves
        slider.addEventListener('input', function() {
            updateValues();
            updateThumbPosition();
        });
        
        // Also handle mousedown, mousemove, and mouseup events for smoother experience
        slider.addEventListener('mousedown', function() {
            document.addEventListener('mousemove', updateThumbPosition);
            document.addEventListener('mouseup', function() {
                document.removeEventListener('mousemove', updateThumbPosition);
            }, { once: true });
        });
        
        // Handle touch events for mobile
        slider.addEventListener('touchstart', function() {
            document.addEventListener('touchmove', updateThumbPosition);
            document.addEventListener('touchend', function() {
                document.removeEventListener('touchmove', updateThumbPosition);
            }, { once: true });
        });
    }
    
    function updateValues() {
        // FIXED: Check if we have tour-specific elements
        if (tourSize && savingsHours) {
            // Format the tour size (shows)
            const shows = parseInt(slider.value);
            currentSavings.textContent = shows + ' shows';
            if (tourSize) tourSize.textContent = shows;
            
            // Calculate savings (3 hours per show planning time)
            const hours = shows * 3;
            if (savingsHours) savingsHours.textContent = hours + ' hours';
            
            // Calculate value ($30/hour planning time)
            const value = hours * 30;
            totalSavings.textContent = '$' + value.toLocaleString();
        } else {
            // Fallback to property value calculation
            const propertyValue = parseInt(slider.value);
            const formattedValue = '$' + propertyValue.toLocaleString(); // FIXED: Added $ sign
            currentSavings.textContent = formattedValue;
            
            // Calculate savings (3% of property value)
            const savingsAmount = Math.round(propertyValue * 0.03);
            totalSavings.textContent = '$' + savingsAmount.toLocaleString(); // FIXED: Added $ sign
        }
    }
    
    function updateThumbPosition() {
        // Calculate position percentage
        const percent = (slider.value - slider.min) / (slider.max - slider.min);
        const thumbPosition = percent * 100;
        
        // Update custom thumb position
        if (sliderThumb) {
            sliderThumb.style.left = `${thumbPosition}%`;
        }
        
        // Update slider track color
        slider.style.background = `linear-gradient(to right, 
            var(--primary-color) 0%, 
            var(--primary-color) ${thumbPosition}%, 
            #e0e0e0 ${thumbPosition}%, 
            #e0e0e0 100%)`;
    }
    
    // Initialize values if slider exists
    if (slider) {
        updateValues();
    }
    
    // Image upload functionality
    const imageUploads = document.querySelectorAll('.image-upload');
    
    imageUploads.forEach(upload => {
        upload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    // Get the parent container
                    const container = e.target.closest('.upload-container');
                    
                    // Set the background image
                    container.style.backgroundImage = `url(${event.target.result})`;
                    container.style.backgroundSize = 'cover';
                    container.style.backgroundPosition = 'center';
                    
                    // Hide the upload label
                    const label = container.querySelector('.upload-label');
                    if (label) {
                        label.style.display = 'none';
                    }
                    
                    // Add a remove button
                    if (!container.querySelector('.remove-image')) {
                        const removeBtn = document.createElement('button');
                        removeBtn.className = 'remove-image';
                        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                        removeBtn.addEventListener('click', function(evt) {
                            evt.stopPropagation();
                            container.style.backgroundImage = 'none';
                            e.target.value = '';
                            if (label) {
                                label.style.display = 'flex';
                            }
                            this.remove();
                        });
                        container.appendChild(removeBtn);
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    });
    
    // FAQ Toggle functionality
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        item.addEventListener('click', function() {
            const toggle = this.querySelector('.faq-toggle');
            
            if (toggle.textContent === '+') {
                toggle.textContent = '-';
                
                // Create and show answer element
                const answer = document.createElement('div');
                answer.classList.add('faq-answer');
                answer.textContent = 'This feature will be available soon. Please contact our support team for more information about tour planning and logistics.';
                
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
            
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    console.log('TourSync initialization complete');
});

// Email popup functionality
function openEmailPopup() {
    const popup = document.getElementById('email-popup');
    if (popup) {
        popup.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Reset form and messages
        const form = document.getElementById('contact-form');
        if (form) form.reset();
        hideMessages();
    }
}

function closeEmailPopup() {
    const popup = document.getElementById('email-popup');
    if (popup) {
        popup.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // Reset form and messages
        const form = document.getElementById('contact-form');
        if (form) form.reset();
        hideMessages();
    }
}

function hideMessages() {
    const successMsg = document.getElementById('success-message');
    const errorMsg = document.getElementById('error-message');
    if (successMsg) successMsg.classList.remove('show');
    if (errorMsg) errorMsg.classList.remove('show');
}

function showSuccessMessage() {
    hideMessages();
    const successMsg = document.getElementById('success-message');
    if (successMsg) successMsg.classList.add('show');
}

function showErrorMessage(message = 'Something went wrong. Please try again.') {
    hideMessages();
    const errorText = document.getElementById('error-text');
    const errorMsg = document.getElementById('error-message');
    if (errorText) errorText.textContent = message;
    if (errorMsg) errorMsg.classList.add('show');
}

// Send email function
async function sendEmail(event) {
    event.preventDefault();
    
    const sendBtn = document.querySelector('.btn-send');
    if (!sendBtn) return;
    
    const originalText = sendBtn.textContent;
    
    // Show loading state
    sendBtn.classList.add('loading');
    sendBtn.textContent = 'Sending...';
    sendBtn.disabled = true;
    
    // Get form data
    const formData = new FormData(event.target);
    const emailData = {
        to: 'support@toursync.app',
        from: formData.get('senderEmail'),
        senderName: formData.get('senderName'),
        subject: formData.get('subject'),
        message: formData.get('message')
    };

    try {
        // Create mailto link as fallback
        const mailtoLink = `mailto:support@toursync.app?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(
            `From: ${emailData.senderName} (${emailData.from})\n\nMessage:\n${emailData.message}`
        )}`;
        
        // Try to open default email client
        window.location.href = mailtoLink;
        
        // Show success message
        showSuccessMessage();
        
        // Auto close after 3 seconds
        setTimeout(() => {
            closeEmailPopup();
        }, 3000);
        
    } catch (error) {
        console.error('Email error:', error);
        showErrorMessage('Unable to open email client. Please contact us directly at support@toursync.app');
    } finally {
        // Reset button state
        sendBtn.classList.remove('loading');
        sendBtn.textContent = originalText;
        sendBtn.disabled = false;
    }
}

// Expose functions globally
window.openEmailPopup = openEmailPopup;
window.closeEmailPopup = closeEmailPopup;
window.sendEmail = sendEmail;

// Close popup when clicking outside or pressing Escape
document.addEventListener('click', function(event) {
    const popup = document.getElementById('email-popup');
    if (event.target === popup) {
        closeEmailPopup();
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeEmailPopup();
    }
});

// Handle contact button clicks
document.addEventListener('DOMContentLoaded', function() {
    // Email icon in footer
    const emailBtn = document.getElementById('email-contact-btn');
    if (emailBtn) {
        emailBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openEmailPopup();
        });
    }
    
    // Contact Us link in navigation
    const contactNavLinks = document.querySelectorAll('a[href="#footer"]');
    contactNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Scroll to footer
            const footer = document.getElementById('footer');
            if (footer) {
                footer.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Open email popup after scroll
                setTimeout(() => {
                    openEmailPopup();
                }, 500);
            }
        });
    });
});

console.log('🎵 TourSync JavaScript loaded successfully');