/**
 * Listing Gallery Script
 * Handles the image gallery functionality for property listing cards
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get gallery elements
    const gallerySlides = document.querySelectorAll('.gallery-slide');
    const prevButton = document.querySelector('.gallery-prev');
    const nextButton = document.querySelector('.gallery-next');
    const indicators = document.querySelectorAll('.indicator');
    
    let currentSlide = 0;
    const slideCount = gallerySlides.length;
    
    // Initialize gallery
    function showSlide(index) {
        // Hide all slides
        gallerySlides.forEach(slide => {
            slide.classList.remove('active');
        });
        
        // Deactivate all indicators
        indicators.forEach(indicator => {
            indicator.classList.remove('active');
        });
        
        // Show the current slide and activate its indicator
        gallerySlides[index].classList.add('active');
        indicators[index].classList.add('active');
        
        // Update current slide index
        currentSlide = index;
    }
    
    // Next slide function
    function nextSlide() {
        let newIndex = currentSlide + 1;
        if (newIndex >= slideCount) {
            newIndex = 0; // Loop back to first slide
        }
        showSlide(newIndex);
    }
    
    // Previous slide function
    function prevSlide() {
        let newIndex = currentSlide - 1;
        if (newIndex < 0) {
            newIndex = slideCount - 1; // Loop to last slide
        }
        showSlide(newIndex);
    }
    
    // Event listeners for controls
    if (prevButton) {
        prevButton.addEventListener('click', function(e) {
            e.preventDefault();
            prevSlide();
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', function(e) {
            e.preventDefault();
            nextSlide();
        });
    }
    
    // Event listeners for indicators
    indicators.forEach(indicator => {
        indicator.addEventListener('click', function() {
            const slideIndex = parseInt(this.getAttribute('data-index'));
            showSlide(slideIndex);
        });
    });
    
    // Auto-advance slides every 5 seconds
    let slideInterval = setInterval(nextSlide, 5000);
    
    // Pause auto-advance on hover
    const galleryContainer = document.querySelector('.listing-gallery-container');
    if (galleryContainer) {
        galleryContainer.addEventListener('mouseenter', function() {
            clearInterval(slideInterval);
        });
        
        galleryContainer.addEventListener('mouseleave', function() {
            slideInterval = setInterval(nextSlide, 5000);
        });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            prevSlide();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
        }
    });
    
    // Initialize with first slide
    showSlide(0);
});
