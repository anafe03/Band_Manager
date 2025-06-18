// js/property-detail-utils.js
// Utility functions for property detail page

// Global functions for HTML onclick handlers
function navigateCalendar(direction) {
    if (window.propertyCalendar) {
        window.propertyCalendar.navigateCalendar(direction);
    }
}

function closeBookingPopup() {
    if (window.propertyCalendar) {
        window.propertyCalendar.closeBookingPopup();
    }
}

function submitBooking(event) {
    if (window.propertyCalendar) {
        window.propertyCalendar.submitBooking(event);
    }
}

function scrollToCalendar() {
    const calendarSection = document.getElementById('calendar-section');
    if (calendarSection) {
        calendarSection.scrollIntoView({
            behavior: 'smooth'
        });
    }
}

function goBack() {
    if (document.referrer && document.referrer.includes('listings.html')) {
        history.back();
    } else {
        window.location.href = '../pages/listings.html';
    }
}

// FIXED: Added the missing openImageModal function
function openImageModal() {
    // Simple implementation - you can enhance this later
    if (window.propertyLoader && window.propertyLoader.images && window.propertyLoader.images.length > 0) {
        const currentImage = window.propertyLoader.images[window.propertyLoader.currentImageIndex || 0];
        console.log('🖼️ Opening image modal for:', currentImage);
        
        // Simple full-screen image viewer
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            cursor: pointer;
        `;
        
        const img = document.createElement('img');
        img.src = currentImage;
        img.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            border-radius: 8px;
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 30px;
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            font-size: 40px;
            cursor: pointer;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        modal.appendChild(img);
        modal.appendChild(closeBtn);
        
        // Close on click
        modal.addEventListener('click', () => {
            document.body.removeChild(modal);
            document.body.style.overflow = 'auto';
        });
        
        // Prevent closing when clicking on image
        img.addEventListener('click', (e) => e.stopPropagation());
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            document.body.style.overflow = 'auto';
        });
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    } else {
        console.warn('No images available to display');
    }
}

// Make functions globally available
window.navigateCalendar = navigateCalendar;
window.closeBookingPopup = closeBookingPopup;
window.submitBooking = submitBooking;
window.scrollToCalendar = scrollToCalendar;
window.goBack = goBack;
window.openImageModal = openImageModal;