// Scrolling Listings Animation
document.addEventListener('DOMContentLoaded', function() {
    console.log('Scrolling listings script loaded');
    
    // Check if the scrolling-listings element exists before initializing
    let scrollingSection = document.getElementById('pricing-card');
    if (!scrollingSection) {
        scrollingSection = document.getElementById('scrolling-listings');
        if (!scrollingSection) {
            console.log('Scrolling listings section not found on this page - skipping initialization');
            return;
        }
    }
    
    // Initialize the scrolling listings
    initScrollingListings();
    
    // Check if the scrolling is working after a short delay
    setTimeout(checkScrollingAnimation, 1000);
});

function initScrollingListings() {
    let scrollingSection = document.getElementById('pricing-card');
    if (!scrollingSection) {
        scrollingSection = document.getElementById('scrolling-listings');
        if (!scrollingSection) {
            // This check is redundant now that we check in the main listener,
            // but keeping it for robustness
            console.log('Scrolling listings section not found');
            return;
        }
    }
    
    const rows = scrollingSection.querySelectorAll('.scrolling-row');
    if (rows.length === 0) {
        console.error('No scrolling rows found');
        return;
    }
    
    console.log(`Found ${rows.length} scrolling rows`);
    
    // Add pause on hover functionality
    rows.forEach((row, index) => {
        row.addEventListener('mouseenter', () => {
            row.style.animationPlayState = 'paused';
        });
        
        row.addEventListener('mouseleave', () => {
            row.style.animationPlayState = 'running';
        });
        
        // Add some visual indication that the row is initialized
        console.log(`Row ${index + 1} initialized`);
    });
    
    // Add hover effects for individual cards
    const cards = scrollingSection.querySelectorAll('.scrolling-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px)';
            card.style.zIndex = '5';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.zIndex = '';
        });
    });
    
    console.log('Scrolling listings initialized successfully');
}

function checkScrollingAnimation() {
    let scrollingSection = document.getElementById('pricing-card');
    if (!scrollingSection) {
        scrollingSection = document.getElementById('scrolling-listings');
        if (!scrollingSection) {
            // Silently return if the section doesn't exist
            return;
        }
    }
    
    const rows = scrollingSection.querySelectorAll('.scrolling-row');
    
    rows.forEach((row, index) => {
        // Get computed style to check if animation is running
        const computedStyle = window.getComputedStyle(row);
        const animationName = computedStyle.getPropertyValue('animation-name');
        const animationDuration = computedStyle.getPropertyValue('animation-duration');
        
        console.log(`Row ${index + 1} animation: ${animationName}, duration: ${animationDuration}`);
        
        // If animation is not running, try to force it
        if (animationName === 'none' || animationName === '') {
            console.warn(`Row ${index + 1} animation not running, attempting to fix...`);
            
            // Apply animation directly
            if (index === 0) {
                row.style.animation = 'scrollListingsLeft 120s linear infinite';
            } else {
                row.style.animation = 'scrollListingsRight 120s linear infinite';
            }
            
            // Force a reflow
            void row.offsetWidth;
        }
    });
}
