// Testimonials are animated using CSS with JS enhancement
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing testimonial animations...');
    
    // Try immediately and then retry with increasing timeouts if needed
    let attempt = 0;
    const maxAttempts = 5;
    
    function attemptInit() {
        console.log(`Testimonial initialization attempt ${attempt + 1}`);
        const success = initTestimonials();
        
        if (!success && attempt < maxAttempts) {
            attempt++;
            // Exponential backoff - wait longer with each attempt
            const timeout = Math.pow(2, attempt) * 100;
            console.log(`Retrying testimonial init in ${timeout}ms`);
            setTimeout(attemptInit, timeout);
        }
    }
    
    // Start the initialization process
    attemptInit();
});

function initTestimonials() {
    console.log('Setting up testimonial enhancements');
    
    // First, verify the section exists
    const testimonialSection = document.getElementById('testimonials');
    if (!testimonialSection) {
        console.error('Testimonial section not found - DOM might not be ready');
        return false; // Return false to indicate failure
    }
    
    // Then check for the rows - try multiple selectors for better resilience
    let testimonialRows = testimonialSection.querySelectorAll('.testimonial-row');
    if (testimonialRows.length === 0) {
        // Try alternative selector approaches
        testimonialRows = document.querySelectorAll('#testimonials .testimonial-row');
        
        if (testimonialRows.length === 0) {
            console.warn('No testimonial rows found, but section exists - DOM might be incomplete');
            return false; // Return false to indicate failure
        }
    }
    
    console.log(`Found ${testimonialRows.length} testimonial rows`);
    
    // Get all cards for hover effects
    const cards = document.querySelectorAll('.testimonial-card');
    console.log(`Found ${cards.length} testimonial cards`);
    
    if (cards.length === 0) {
        console.warn('No testimonial cards found - DOM might be incomplete');
        return false; // Return false to indicate failure
    }
    
    // Function to check if element is in viewport (for potential future use)
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.bottom >= 0
        );
    }
    
    // Add pause on hover functionality for rows - with error handling
    testimonialRows.forEach(row => {
        try {
            row.addEventListener('mouseenter', () => {
                row.style.animationPlayState = 'paused';
            });
            
            row.addEventListener('mouseleave', () => {
                row.style.animationPlayState = 'running';
            });
        } catch (e) {
            console.warn('Error setting up row animations:', e);
        }
    });
    
    // Add hover effects for individual cards - with error handling
    cards.forEach(card => {
        try {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px) scale(1.05)';
                card.style.zIndex = '5';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                card.style.zIndex = '';
            });
        } catch (e) {
            console.warn('Error setting up card hover effects:', e);
        }
    });
    
    console.log('Testimonial elements found and animations configured successfully');
    return true; // Return true to indicate success
}
