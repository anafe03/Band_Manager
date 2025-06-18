/**
 * Calendar Script
 * Implements a comprehensive calendar system with even-sized grid cells
 * and a booking popup that appears when a date is selected
 * Integrates with availability-sync.js for shared availability data management
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if availability-sync.js is loaded, if not, load it dynamically
    if (typeof getSavedAvailability !== 'function') {
        console.log('Loading availability-sync.js dynamically');
        const script = document.createElement('script');
        script.src = '../js/availability-sync.js';
        document.head.appendChild(script);
    }
    
    // Function to get saved availability for a specific date
    function getSavedAvailabilityForDate(date) {
        // Use the shared availability-sync.js function if available
        if (typeof getAvailableTimeSlots === 'function') {
            return getAvailableTimeSlots(date);
        } else {
            // Fallback to direct localStorage access
            const savedAvailability = JSON.parse(localStorage.getItem('savedAvailability') || '{}');
            const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
            return savedAvailability[dateKey] || [];
        }
    }
    
    // Calendar generation
    const calendarGrid = document.getElementById('calendar-grid') || document.querySelector('.calendar-grid');
    const currentPeriodElement = document.querySelector('.current-period');
    const bookingPopupOverlay = document.getElementById('booking-popup-overlay');
    const popupClose = document.getElementById('popup-close');
    const selectedDateElements = document.querySelectorAll('.selected-date');
    const timeSlots = document.querySelectorAll('.time-slot-option');
    const bookingForm = document.querySelector('.booking-form');
    
    // Check if calendar grid exists
    if (!calendarGrid) {
        // Only log a message in development mode, not an error
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Calendar grid element not present on this page - calendar functionality not initialized');
        }
        return;
    }
    
    // Current date information
    const currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    
    // Function to update the saved availability display
    function updateSavedAvailabilityDisplay() {
        const savedAvailabilityContainer = document.getElementById('saved-availability');
        if (!savedAvailabilityContainer) return;
        
        // Clear existing content
        savedAvailabilityContainer.innerHTML = '';
        
        // Get saved availability data using the shared function if available
        const savedAvailability = typeof getSavedAvailability === 'function' ? 
            getSavedAvailability() : 
            JSON.parse(localStorage.getItem('savedAvailability') || '{}');
        
        // Check if there's any saved availability
        if (Object.keys(savedAvailability).length === 0) {
            savedAvailabilityContainer.innerHTML = '<p>No availability set yet.</p>';
            return;
        }
        
        // Create a section for each date with availability
        Object.keys(savedAvailability).forEach(dateKey => {
            const dateSection = document.createElement('div');
            dateSection.className = 'saved-availability-date';
            
            // Format date for display
            const dateParts = dateKey.split('-');
            const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const displayDate = date.toLocaleDateString('en-US', options);
            
            // Add date header
            dateSection.innerHTML = `<h4>${displayDate}</h4>`;
            
            // Add time slots
            savedAvailability[dateKey].forEach(timeSlot => {
                const timeSlotElement = document.createElement('p');
                timeSlotElement.textContent = timeSlot;
                dateSection.appendChild(timeSlotElement);
            });
            
            // Add delete button
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-availability';
            deleteButton.innerHTML = '<i class="fas fa-trash"></i> Remove';
            dateSection.appendChild(deleteButton);
            
            // Add delete functionality for each date
            deleteButton.addEventListener('click', function() {
                // Use the shared function if available
                if (typeof removeAvailabilitySlot === 'function') {
                    // Get the time slots for this date
                    const timeSlots = savedAvailability[dateKey] || [];
                    
                    // Remove each time slot
                    timeSlots.forEach(slot => {
                        removeAvailabilitySlot(dateKey, slot);
                    });
                } else {
                    // Fallback to direct localStorage manipulation
                    // Get saved availability
                    const savedAvailability = JSON.parse(localStorage.getItem('savedAvailability') || '{}');
                    
                    // Delete this date's availability
                    delete savedAvailability[dateKey];
                    
                    // Save back to localStorage
                    localStorage.setItem('savedAvailability', JSON.stringify(savedAvailability));
                }
                
                // Update display
                updateSavedAvailabilityDisplay();
            });
            
            // Add to container
            savedAvailabilityContainer.appendChild(dateSection);
        });
    }
    
    // Function to generate the calendar
    function generateCalendar(month, year) {
        console.log("Generating calendar for month:", month, "year:", year);
        // Clear previous calendar content
        calendarGrid.innerHTML = '';
        
        // Note: We're not creating day headers dynamically anymore since they already exist in the HTML
        
        // Update the period text
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        currentPeriodElement.textContent = `${months[month]} ${year}`;
        
        // Get the first day of the month
        const firstDay = new Date(year, month, 1).getDay();
        
        // Get the number of days in the month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Get the number of days in the previous month
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        // Calculate the number of rows needed
        const totalDays = firstDay + daysInMonth;
        const rows = Math.ceil(totalDays / 7);
        
        // Create the calendar grid
        let dayCount = 1;
        let nextMonthDay = 1;
        
        // Create days from previous month
        for (let i = 0; i < firstDay; i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day other-month';
            day.innerHTML = `<div class="day-number">${daysInPrevMonth - firstDay + i + 1}</div>`;
            calendarGrid.appendChild(day);
        }
        
        // Create days from current month
        for (let i = firstDay; i < totalDays; i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day';
            
            // Check if it's today
            if (dayCount === currentDate.getDate() && month === currentDate.getMonth() && year === currentDate.getFullYear()) {
                day.classList.add('today');
            }
            
            day.innerHTML = `<div class="day-number">${dayCount}</div>`;
            day.setAttribute('data-date', `${year}-${month + 1}-${dayCount}`);
            
            // Check if this day has saved availability
            const dateObj = new Date(year, month, dayCount);
            if (hasAvailability(dateObj)) {
                day.classList.add('has-availability');
                
                // Add availability indicator
                const availabilityIndicator = document.createElement('div');
                availabilityIndicator.className = 'availability-indicator';
                availabilityIndicator.title = 'Has saved availability';
                day.appendChild(availabilityIndicator);
            }
            
            // Add click event to show booking popup
            day.addEventListener('click', function() {
                const selectedDate = this.getAttribute('data-date');
                const dateParts = selectedDate.split('-');
                const formattedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                
                // Format the date for display
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                const displayDate = formattedDate.toLocaleDateString('en-US', options);
                
                // Update all selected date elements
                selectedDateElements.forEach(element => {
                    element.textContent = displayDate;
                });
                
                // Show the booking popup with improved visibility
                if (bookingPopupOverlay) {
                    console.log('Showing booking popup for date:', displayDate);
                    bookingPopupOverlay.style.display = 'flex';
                    bookingPopupOverlay.style.opacity = '1';
                    setTimeout(() => {
                        bookingPopupOverlay.classList.add('active');
                    }, 10);
                } else {
                    console.error('Booking popup overlay not found');
                }
                
                // Remove selected class from all days
                document.querySelectorAll('.calendar-day').forEach(d => {
                    d.classList.remove('selected');
                });
                
                // Add selected class to clicked day
                this.classList.add('selected');
            });
            
            calendarGrid.appendChild(day);
            dayCount++;
            
            if (dayCount > daysInMonth) {
                break;
            }
        }
        
        // Fill in the rest of the grid with days from the next month
        const remainingCells = 7 * rows - (firstDay + daysInMonth);
        for (let i = 0; i < remainingCells; i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day other-month';
            day.innerHTML = `<div class="day-number">${nextMonthDay}</div>`;
            calendarGrid.appendChild(day);
            nextMonthDay++;
        }
    }
    
    // Initial calendar generation
    generateCalendar(currentMonth, currentYear);
    
    // Navigation buttons event listeners
    document.querySelector('.prev-btn').addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateCalendar(currentMonth, currentYear);
    });
    
    document.querySelector('.next-btn').addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendar(currentMonth, currentYear);
    });
    
    // Close popup when clicking the close button
    if (popupClose) {
        popupClose.addEventListener('click', function() {
            bookingPopupOverlay.classList.remove('active');
            setTimeout(() => {
                bookingPopupOverlay.style.display = 'none';
            }, 300);
        });
    } else {
        console.error('Popup close button not found');
    }
    
    // Close popup when clicking outside of it
    if (bookingPopupOverlay) {
        bookingPopupOverlay.addEventListener('click', function(event) {
            if (event.target === bookingPopupOverlay) {
                bookingPopupOverlay.classList.remove('active');
                setTimeout(() => {
                    bookingPopupOverlay.style.display = 'none';
                }, 300);
            }
        });
    } else {
        console.error('Booking popup overlay not found');
    }
    
    // Time slot selection
    if (timeSlots && timeSlots.length > 0) {
        timeSlots.forEach(slot => {
            slot.addEventListener('click', function() {
                // Remove selected class from all time slots
                timeSlots.forEach(s => s.classList.remove('selected'));
                
                // Add selected class to clicked time slot
                this.classList.add('selected');
            });
        });
    } else {
        console.warn('No time slots found');
    }
    
    // Toggle between week and month views
    const viewButtons = document.querySelectorAll('.view-toggle-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            viewButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
        });
    });
    
    // Handle form submission
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // In a real application, you'd collect form data and send to server
            // For demo purposes, show a success message
            alert('Booking submitted successfully! We will contact you to confirm.');
            
            // Reset form and close popup
            this.reset();
            bookingPopupOverlay.classList.remove('active');
            setTimeout(() => {
                bookingPopupOverlay.style.display = 'none';
            }, 300);
        });
    } else {
        console.error('Booking form not found');
    }
});
