// Featured Listings are animated using CSS with JS enhancement
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing featured listings animations...');
    
    // Try immediately and then retry with increasing timeouts if needed
    let attempt = 0;
    const maxAttempts = 5;
    
    function attemptInit() {
        console.log(`Featured listings initialization attempt ${attempt + 1}`);
        const success = initFeaturedListings();
        
        if (!success && attempt < maxAttempts) {
            attempt++;
            // Exponential backoff - wait longer with each attempt
            const timeout = Math.pow(2, attempt) * 100;
            console.log(`Retrying featured listings init in ${timeout}ms`);
            setTimeout(attemptInit, timeout);
        }
    }
    
    // Start the initialization process
    attemptInit();
    
    // Force a reflow to trigger animations
    setTimeout(() => {
        const listingsRows = document.querySelectorAll('.listings-row');
        listingsRows.forEach(row => {
            row.style.display = 'none';
            // Force reflow
            void row.offsetWidth;
            row.style.display = 'flex';
        });
        console.log('Forced reflow to trigger animations');
    }, 500);
});

function initFeaturedListings() {
    console.log('Setting up featured listings enhancements');
    
    // First, verify the section exists
    let featuredListingsSection = document.getElementById('pricing-card');
    if (!featuredListingsSection) {
        featuredListingsSection = document.getElementById('featured-listings');
        if (!featuredListingsSection) {
            console.error('Featured listings section not found - DOM might not be ready');
            return false; // Return false to indicate failure
        }
    }
    
    // Then check for the rows - try multiple selectors for better resilience
    let listingsRows = featuredListingsSection.querySelectorAll('.scrolling-row');
    if (listingsRows.length === 0) {
        // Try alternative selector approaches
        listingsRows = document.querySelectorAll('#pricing-card .scrolling-row, #featured-listings .scrolling-row');
        
        if (listingsRows.length === 0) {
            console.warn('No listings rows found, but section exists - DOM might be incomplete');
            return false; // Return false to indicate failure
        }
    }
    
    console.log(`Found ${listingsRows.length} listings rows`);
    
    // Get all cards for hover effects
    const cards = document.querySelectorAll('.scrolling-card');
    console.log(`Found ${cards.length} listing cards`);
    
    if (cards.length === 0) {
        console.warn('No listing cards found - DOM might be incomplete');
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
    listingsRows.forEach(row => {
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
                card.style.transform = 'translateY(-10px) scale(1.02)';
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
    
    console.log('Featured listings elements found and animations configured successfully');
    return true; // Return true to indicate success
}
