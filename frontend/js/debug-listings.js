// Debug script to help troubleshoot the scrolling listings
document.addEventListener('DOMContentLoaded', function() {
    console.log('Debug script loaded');
    
    // Check if we're on the services page
    if (window.location.pathname.includes('services.html') || document.title.includes('Services')) {
        console.log('On services page, initializing debug');
        setTimeout(debugListings, 1000);
    } else {
        console.log('Not on services page, pathname:', window.location.pathname);
    }
});

function debugListings() {
    console.log('Running listings debug');
    
    // Check if the featured listings section exists
    const listingsSection = document.getElementById('featured-listings');
    if (!listingsSection) {
        console.error('Featured listings section not found!');
        return;
    }
    
    console.log('Featured listings section found:', listingsSection);
    
    // Check the rows
    const rows = listingsSection.querySelectorAll('.listings-row');
    console.log(`Found ${rows.length} listing rows`);
    
    if (rows.length === 0) {
        console.error('No listing rows found!');
        return;
    }
    
    // Apply direct styles to ensure visibility and animation
    rows.forEach((row, index) => {
        const direction = index === 0 ? 'scrollLeft' : 'scrollRight';
        const currentAnimation = row.style.animation;
        
        console.log(`Row ${index+1} current animation:`, currentAnimation);
        
        // Force animation if not already set
        if (!currentAnimation || !currentAnimation.includes(direction)) {
            console.log(`Applying animation to row ${index+1}`);
            row.style.animation = `${direction} 30s linear infinite`;
        }
        
        // Make sure the row is visible
        row.style.display = 'flex';
        row.style.opacity = '1';
        
        // Log the cards in this row
        const cards = row.querySelectorAll('.listing-card');
        console.log(`Row ${index+1} has ${cards.length} cards`);
    });
    
    // Make sure the container is visible
    const container = listingsSection.querySelector('.listings-container');
    if (container) {
        container.style.overflow = 'visible';
        container.style.display = 'flex';
        container.style.opacity = '1';
    }
    
    // Force a reflow to trigger animations
    void listingsSection.offsetWidth;
    
    console.log('Debug complete - animations should be visible now');
}
