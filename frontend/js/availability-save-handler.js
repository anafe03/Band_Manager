/**
 * Availability Save Handler
 * This script handles the save button functionality for the availability popup
 * It collects selected time slots and saves them using the availability-sync.js module
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Availability Save Handler loaded');
    // Initialize the save button handler
    initSaveButtonHandler();
    
    // Add a small delay to ensure all elements are fully loaded
    setTimeout(function() {
        console.log('Checking for time slot elements after delay');
        const timeSlots = document.querySelectorAll('.booking-popup-overlay .time-slot-option');
        console.log('Found time slots:', timeSlots.length);
        
        const saveButton = document.querySelector('.booking-popup-overlay .save-availability-btn');
        console.log('Save button found:', saveButton !== null);
    }, 1000);
});

/**
 * Initialize the save button handler for availability popup
 */
function initSaveButtonHandler() {
    // Get the save button in the booking popup
    const saveButton = document.querySelector('.booking-popup-overlay .save-availability-btn');
    const cancelButton = document.querySelector('.booking-popup-overlay .cancel-availability');
    const popupOverlay = document.getElementById('booking-popup-overlay');
    const timeSlots = document.querySelectorAll('.booking-popup-overlay .time-slot-option');
    
    // Check if elements exist
    if (!saveButton || !timeSlots.length) {
        console.log('Save button or time slots not found, skipping initialization');
        return;
    }
    
    console.log('Initializing save button handler');
    
    // Add click event listeners to time slots for multiple selection
    timeSlots.forEach(slot => {
        slot.addEventListener('click', function() {
            // Toggle selected class
            this.classList.toggle('selected');
            
            // Update visual style based on selection state
            if (this.classList.contains('selected')) {
                this.style.backgroundColor = '#4CAF50';  // Use the site's green color
                this.style.color = 'white';
                this.style.borderColor = '#4CAF50';
            } else {
                this.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
                this.style.color = '#33443c';
                this.style.borderColor = 'rgba(51, 68, 60, 0.2)';
            }
        });
    });
    
    // Add click event listener to save button
    saveButton.addEventListener('click', function() {
        // Get the selected date from the popup
        const selectedDateEl = document.querySelector('.booking-popup .selected-date');
        if (!selectedDateEl) {
            console.error('Selected date element not found');
            return;
        }
        
        // Parse the selected date text
        const dateText = selectedDateEl.textContent;
        const selectedDate = new Date(dateText);
        
        if (isNaN(selectedDate.getTime())) {
            console.error('Invalid date:', dateText);
            return;
        }
        
        // Collect all selected time slots
        const selectedTimeSlots = [];
        document.querySelectorAll('.booking-popup-overlay .time-slot-option.selected').forEach(slot => {
            selectedTimeSlots.push(slot.textContent.trim());
        });
        
        console.log('Selected date:', selectedDate);
        console.log('Selected time slots:', selectedTimeSlots);
        
        // Check if any time slots were selected
        if (selectedTimeSlots.length === 0) {
            alert('Please select at least one time slot');
            return;
        }
        
        // Save the availability using the shared module
        if (typeof addAvailability === 'function') {
            console.log('Saving availability for date:', selectedDate);
            
            // Call the addAvailability function from availability-sync.js with the correct parameters
            // It expects a Date object and an array of time slots
            addAvailability(selectedDate, selectedTimeSlots);
            
            // Show confirmation message
            alert(`Availability saved for ${dateText}`);
            
            // Close the popup
            if (popupOverlay) {
                popupOverlay.style.display = 'none';
            }
        } else {
            console.error('addAvailability function not found');
            alert('Error: Could not save availability. Please try again later.');
        }
    });
    
    // Add click event listener to cancel button
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            // Close the popup without saving
            if (popupOverlay) {
                popupOverlay.style.display = 'none';
            }
            
            // Reset time slot selection
            timeSlots.forEach(slot => {
                slot.classList.remove('selected');
                slot.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
                slot.style.color = '#33443c';
                slot.style.borderColor = 'rgba(51, 68, 60, 0.2)';
            });
        });
    }
}
