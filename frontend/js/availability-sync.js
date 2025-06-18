/**
 * Availability Sync - Shared functionality for syncing availability between calendars
 * This script provides shared functions for managing and syncing availability data
 * between the agent's availability calendar and the client's scheduling calendar
 */

// Shared storage keys
const AVAILABILITY_STORAGE_KEY = 'savedAvailability';

/**
 * Get all saved availability slots from localStorage
 * @returns {Object} Object with dates as keys and arrays of time slots as values
 */
function getSavedAvailability() {
    const savedData = localStorage.getItem(AVAILABILITY_STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : {};
}

/**
 * Save availability slots to localStorage
 * @param {Object} availabilityData Object with dates as keys and arrays of time slots as values
 */
function saveAvailability(availabilityData) {
    localStorage.setItem(AVAILABILITY_STORAGE_KEY, JSON.stringify(availabilityData));
}

/**
 * Add availability for a specific date
 * @param {Date} date The date to add availability for
 * @param {Array} timeSlots Array of time slots (e.g., ["9:00 AM", "10:00 AM"])
 */
function addAvailability(date, timeSlots) {
    console.log('🔧 addAvailability called with:', { date, timeSlots });
    
    const dateKey = formatDateKey(date);
    console.log('🔧 Generated dateKey:', dateKey);
    
    // Get current data directly from localStorage to avoid function conflicts
    const currentData = localStorage.getItem(AVAILABILITY_STORAGE_KEY);
    const savedAvailability = currentData ? JSON.parse(currentData) : {};
    console.log('🔧 Current saved availability before update:', savedAvailability);
    
    savedAvailability[dateKey] = timeSlots;
    console.log('🔧 Updated availability object:', savedAvailability);
    
    // Save directly to localStorage
    localStorage.setItem(AVAILABILITY_STORAGE_KEY, JSON.stringify(savedAvailability));
    console.log('🔧 Saved to localStorage');
    
    // Verify it was saved by reading directly again
    const verifyData = localStorage.getItem(AVAILABILITY_STORAGE_KEY);
    const parsedVerifyData = verifyData ? JSON.parse(verifyData) : {};
    console.log('🔧 Verified saved data:', parsedVerifyData);
    console.log('🔧 New date key exists in saved data:', parsedVerifyData.hasOwnProperty(dateKey));
    console.log('🔧 New date key value:', parsedVerifyData[dateKey]);
    
    // Dispatch an event to notify other calendars
    const event = new CustomEvent('availabilityChanged', {
        detail: { dateKey, timeSlots }
    });
    document.dispatchEvent(event);
    console.log('🔧 Event dispatched');
}

/**
 * Remove availability for a specific date and time slot
 * @param {string} dateKey The date key (YYYY-M-D format)
 * @param {string} timeSlot The time slot to remove
 */
function removeAvailabilitySlot(dateKey, timeSlot) {
    const savedAvailability = getSavedAvailability();
    
    if (savedAvailability[dateKey]) {
        savedAvailability[dateKey] = savedAvailability[dateKey].filter(slot => slot !== timeSlot);
        
        // Remove the date entirely if no more slots
        if (savedAvailability[dateKey].length === 0) {
            delete savedAvailability[dateKey];
        }
        
        saveAvailability(savedAvailability);
        
        // Dispatch an event to notify other calendars
        const event = new CustomEvent('availabilityChanged', {
            detail: { dateKey, removed: true, timeSlot }
        });
        document.dispatchEvent(event);
    }
}

/**
 * Check if a specific date has any availability
 * @param {Date} date The date to check
 * @returns {boolean} True if the date has availability, false otherwise
 */
function hasAvailability(date) {
    const dateKey = formatDateKey(date);
    const savedAvailability = getSavedAvailability();
    return !!savedAvailability[dateKey] && savedAvailability[dateKey].length > 0;
}

/**
 * Get available time slots for a specific date
 * @param {Date} date The date to get availability for
 * @returns {Array} Array of available time slots, or empty array if none
 */
function getAvailableTimeSlots(date) {
    const dateKey = formatDateKey(date);
    const savedAvailability = getSavedAvailability();
    return savedAvailability[dateKey] || [];
}

/**
 * Format a date object into a consistent key format (YYYY-M-D)
 * @param {Date} date The date to format
 * @returns {string} Formatted date key
 */
function formatDateKey(date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/**
 * Parse a date key (YYYY-M-D) into a Date object
 * @param {string} dateKey The date key to parse
 * @returns {Date} Date object
 */
function parseDateKey(dateKey) {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Dispatch an event to notify other calendars of availability changes
 * This helps ensure all calendar instances stay in sync
 */
function dispatchAvailabilityChangedEvent() {
    console.log('Dispatching availability changed event');
    const event = new CustomEvent('availabilityChanged', {
        detail: { timestamp: Date.now() }
    });
    document.dispatchEvent(event);
}

// Set up event listener for availability changes
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('availabilityChanged', function(event) {
        console.log('Availability changed event received:', event.detail);
    });
});
