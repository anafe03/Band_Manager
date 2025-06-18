/**
 * Market Insights Section - Domino Effect Animation
 * This script creates a sequential reveal animation for the market insights table rows
 * as the user scrolls to the section, creating a domino/cascade effect.
 */
document.addEventListener('DOMContentLoaded', function() {
    // Target the market insights section and table rows
    const marketInsightsSection = document.getElementById('market-insights');
    const tableRows = marketInsightsSection.querySelectorAll('.stats-table tbody tr');
    const tableHeader = marketInsightsSection.querySelector('.stats-table thead tr');
    const tableSource = marketInsightsSection.querySelector('.stats-source');
    
    // Initial state - hide all rows and the source text
    tableRows.forEach(row => {
        row.style.opacity = '0';
        row.style.transform = 'translateY(20px)';
        row.style.transition = 'opacity 0.8s ease, transform 0.8s ease'; // Longer transition
    });
    
    if (tableHeader) {
        tableHeader.style.opacity = '0';
        tableHeader.style.transform = 'translateY(20px)';
        tableHeader.style.transition = 'opacity 0.8s ease, transform 0.8s ease'; // Longer transition
    }
    
    if (tableSource) {
        tableSource.style.opacity = '0';
        tableSource.style.transform = 'translateY(20px)';
        tableSource.style.transition = 'opacity 0.8s ease, transform 0.8s ease'; // Longer transition
    }
    
    // Function to check if an element is in the viewport
    function isInViewport(element, offset = 150) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight - offset) &&
            rect.bottom >= 0
        );
    }
    
    // Function to animate the table rows in sequence
    function animateMarketInsights() {
        if (isInViewport(marketInsightsSection)) {
            // First show the table header
            if (tableHeader) {
                setTimeout(() => {
                    tableHeader.style.opacity = '1';
                    tableHeader.style.transform = 'translateY(0)';
                }, 300); // Increased initial delay
            }
            
            // Then show each row with a sequential delay
            tableRows.forEach((row, index) => {
                setTimeout(() => {
                    row.style.opacity = '1';
                    row.style.transform = 'translateY(0)';
                }, 600 + (index * 250)); // Longer delay between each row (increased from 150ms to 250ms)
            });
            
            // Finally show the source text
            if (tableSource) {
                setTimeout(() => {
                    tableSource.style.opacity = '1';
                    tableSource.style.transform = 'translateY(0)';
                }, 600 + (tableRows.length * 250) + 200); // Adjusted timing based on new row delays
            }
            
            // Remove the scroll event once animation is triggered
            window.removeEventListener('scroll', animateMarketInsights);
        }
    }
    
    // Add scroll event listener
    window.addEventListener('scroll', animateMarketInsights);
    
    // Check initial state (in case section is already in viewport on page load)
    animateMarketInsights();
});
