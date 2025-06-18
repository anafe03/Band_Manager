/**
 * Schedule Calendar Script
 * Implements a comprehensive property showing scheduling system with even-sized grid cells
 * and a booking popup form that appears when a date is selected
 * This script extends the functionality of calendar.js and integrates with availability-sync.js
 * to display agent availability for booking
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if availability-sync.js is loaded, if not, load it dynamically
    if (typeof getSavedAvailability !== 'function') {
        console.log('Loading availability-sync.js dynamically');
        const script = document.createElement('script');
        script.src = '../js/availability-sync.js';
        document.head.appendChild(script);
        
        // Wait for the script to load before proceeding
        script.onload = initScheduleCalendar;
    } else {
        initScheduleCalendar();
    }
});

function initScheduleCalendar() {
    // Calendar elements
    const calendarGrid = document.querySelector('.calendar-grid');
    const monthViewBtn = document.querySelector('.view-toggle-btn[data-view="month"]');
    const weekViewBtn = document.querySelector('.view-toggle-btn[data-view="week"]');
    const monthView = document.querySelector('.calendar-month-view');
    const weekView = document.querySelector('.calendar-week-view');
    const prevBtn = document.querySelector('.nav-btn.prev-btn');
    const nextBtn = document.querySelector('.nav-btn.next-btn');
    const currentPeriodEl = document.querySelector('.current-period');
    const backToCalendarBtn = document.querySelector('.back-to-calendar');
    const bookingFormSection = document.getElementById('booking-form');
    const confirmationSection = document.getElementById('booking-confirmation');
    
    // Create booking popup overlay if it doesn't exist
    if (!document.getElementById('booking-popup-overlay')) {
        const bookingPopupOverlay = document.createElement('div');
        bookingPopupOverlay.id = 'booking-popup-overlay';
        bookingPopupOverlay.className = 'booking-popup-overlay';
        bookingPopupOverlay.innerHTML = `
            <div class="booking-popup">
                <button class="popup-close" id="popup-close">&times;</button>
                <h3>Availability for <span class="selected-date">Select a date</span></h3>
                
                <div class="time-slots-container">
                    <div class="time-slot-option">9:00 AM</div>
                    <div class="time-slot-option">10:00 AM</div>
                    <div class="time-slot-option">11:00 AM</div>
                    <div class="time-slot-option">12:00 PM</div>
                    <div class="time-slot-option">1:00 PM</div>
                    <div class="time-slot-option">2:00 PM</div>
                    <div class="time-slot-option">3:00 PM</div>
                    <div class="time-slot-option">4:00 PM</div>
                    <div class="time-slot-option">5:00 PM</div>
                </div>
                
                <form class="booking-form">
                    <div class="form-group">
                        <label for="visitor-name">Name</label>
                        <input type="text" id="visitor-name" name="visitor-name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="visitor-email">Email</label>
                        <input type="email" id="visitor-email" name="visitor-email" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="visitor-phone">Phone</label>
                        <input type="tel" id="visitor-phone" name="visitor-phone" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Agent or Non-Agent</label>
                        <div class="radio-group">
                            <div class="radio-item">
                                <input type="radio" id="agent-yes" name="agent-status" value="agent">
                                <label for="agent-yes">Agent</label>
                            </div>
                            <div class="radio-item">
                                <input type="radio" id="agent-no" name="agent-status" value="non-agent" checked>
                                <label for="agent-no">Non-Agent</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Pre-approved</label>
                        <div class="yes-no-group">
                            <div class="radio-item">
                                <input type="radio" id="preapproved-yes" name="preapproved" value="yes">
                                <label for="preapproved-yes">Yes</label>
                            </div>
                            <div class="radio-item">
                                <input type="radio" id="preapproved-no" name="preapproved" value="no" checked>
                                <label for="preapproved-no">No</label>
                            </div>
                        </div>
                    </div>
                    
                    <button type="submit" class="book-now-btn">Book Now</button>
                </form>
            </div>
        `;
        document.querySelector('#scheduling-calendar').appendChild(bookingPopupOverlay);
    }

    // Initialize popup close and time slot selection events
    const popupClose = document.getElementById('popup-close');
    const timeSlots = document.querySelectorAll('.time-slot-option');
    const bookingForm = document.querySelector('.booking-popup .booking-form');

    if (popupClose) {
        popupClose.addEventListener('click', function() {
            const popup = document.getElementById('booking-popup-overlay');
            // Smooth transition for closing
            popup.classList.remove('active');
            // Wait for the transition to complete before hiding
            setTimeout(() => {
                popup.style.display = 'none';
            }, 300);
        });
    }

    if (timeSlots) {
        timeSlots.forEach(slot => {
            slot.addEventListener('click', function() {
                // Remove selected class from all time slots
                timeSlots.forEach(s => s.classList.remove('selected'));
                
                // Add selected class to clicked time slot
                this.classList.add('selected');
            });
        });
    }

    // Calendar state
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let selectedDate = null;
    let selectedTimeSlot = null;
    let viewMode = 'month'; // 'month' or 'week'
    
    // Get saved availability data
    let savedAvailability = typeof getSavedAvailability === 'function' ? getSavedAvailability() : {};
    
    // Months array for display
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Days of week for display
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Initialize calendar
    initCalendar();
    
    // Listen for availability changes from other calendars
    document.addEventListener('availabilityChanged', function(event) {
        console.log('Availability changed event received:', event.detail);
        // Update saved availability
        savedAvailability = getSavedAvailability();
        // Re-render calendar to show updated availability
        renderCalendar();
    });
    
    // Event listeners for view toggle
    if (monthViewBtn) {
        monthViewBtn.addEventListener('click', function() {
            setViewMode('month');
        });
    }
    
    if (weekViewBtn) {
        weekViewBtn.addEventListener('click', function() {
            setViewMode('week');
        });
    }
    
    // Event listeners for navigation
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            navigateCalendar('prev');
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            navigateCalendar('next');
        });
    }
    
    // Event listener for back to calendar button
    if (backToCalendarBtn) {
        backToCalendarBtn.addEventListener('click', function() {
            bookingFormSection.style.display = 'none';
            document.getElementById('scheduling-calendar').style.display = 'block';
        });
    }
    
    // Event listener for booking form submission
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get selected time
            const selectedTimeEl = document.querySelector('.time-slot-option.selected');
            if (selectedTimeEl) {
                selectedTimeSlot = selectedTimeEl.textContent;
            }
            
            // Get the popup overlay
            const popup = document.getElementById('booking-popup-overlay');
            
            // In a real app, you would send the form data to the server here
            // For demo purposes, we'll just show a success message
            alert("Booking confirmed for " + formatDate(selectedDate) + " at " + selectedTimeSlot);
            
            // Update availability to remove the booked slot
            if (selectedDate && selectedTimeSlot) {
                const dateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
                
                // If we have the removeAvailabilitySlot function from availability-sync.js
                if (typeof removeAvailabilitySlot === 'function') {
                    removeAvailabilitySlot(dateKey, selectedTimeSlot);
                } else {
                    // Fallback if the function isn't available
                    const savedAvailability = JSON.parse(localStorage.getItem('savedAvailability') || '{}');
                    if (savedAvailability[dateKey]) {
                        savedAvailability[dateKey] = savedAvailability[dateKey].filter(slot => slot !== selectedTimeSlot);
                        if (savedAvailability[dateKey].length === 0) {
                            delete savedAvailability[dateKey];
                        }
                        localStorage.setItem('savedAvailability', JSON.stringify(savedAvailability));
                    }
                }
                
                // Re-render calendar to reflect the change
                renderCalendar();
            }
            
            // Smooth transition for closing popup
            popup.classList.remove('active');
            
            // Wait for the transition to complete before hiding
            setTimeout(() => {
                popup.style.display = 'none';
            }, 300);
            
            // Reset form
            this.reset();
            
            // Remove selected class from time slots
            document.querySelectorAll('.time-slot-option').forEach(slot => {
                slot.classList.remove('selected');
            });
        });
    }
    
    // Calendar initialization function
    function initCalendar() {
        updateCalendarHeader();
        renderCalendar();
    }
    
    // Set calendar view mode (month or week)
    function setViewMode(mode) {
        viewMode = mode;
        
        // Update active button
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelector(`.view-toggle-btn[data-view="${mode}"]`).classList.add('active');
        
        // Show appropriate view
        if (mode === 'month') {
            if (monthView) monthView.classList.add('active');
        } else {
            if (monthView) monthView.classList.remove('active');
        }
        
        // Re-render calendar
        renderCalendar();
    }
    
    // Navigate calendar (previous or next period)
    function navigateCalendar(direction) {
        if (viewMode === 'month') {
            // Navigate months
            if (direction === 'prev') {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
            } else {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
            }
        } else {
            // Navigate weeks
            const adjustment = direction === 'prev' ? -7 : 7;
            const newDate = new Date(currentYear, currentMonth, currentDate.getDate() + adjustment);
            currentYear = newDate.getFullYear();
            currentMonth = newDate.getMonth();
            currentDate = newDate;
        }
        
        updateCalendarHeader();
        renderCalendar();
    }
    
    // Update calendar header with current period
    function updateCalendarHeader() {
        if (!currentPeriodEl) return;
        
        if (viewMode === 'month') {
            currentPeriodEl.textContent = `${months[currentMonth]} ${currentYear}`;
        } else {
            const startOfWeek = getStartOfWeek(currentDate);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            
            const startMonth = months[startOfWeek.getMonth()];
            const endMonth = months[endOfWeek.getMonth()];
            const startYear = startOfWeek.getFullYear();
            const endYear = endOfWeek.getFullYear();
            
            if (startMonth === endMonth && startYear === endYear) {
                currentPeriodEl.textContent = `${startMonth} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${startYear}`;
            } else if (startYear === endYear) {
                currentPeriodEl.textContent = `${startMonth} ${startOfWeek.getDate()} - ${endMonth} ${endOfWeek.getDate()}, ${startYear}`;
            } else {
                currentPeriodEl.textContent = `${startMonth} ${startOfWeek.getDate()}, ${startYear} - ${endMonth} ${endOfWeek.getDate()}, ${endYear}`;
            }
        }
    }
    
    // Render calendar based on current view mode
    function renderCalendar() {
        if (viewMode === 'month') {
            renderMonthView();
        } else {
            renderWeekView();
        }
    }
    
    // Render month view calendar with evenly sized cells
    function renderMonthView() {
        if (!calendarGrid) return;
        
        // Clear the grid
        calendarGrid.innerHTML = '';
        
        // Update the current period display
        updateCalendarHeader();
        // Add day headers
        daysOfWeek.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });
        
        // Get the first day of the month
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        
        // Get the day of week the first day falls on (0 = Sunday, 6 = Saturday)
        const firstDayOfWeek = firstDayOfMonth.getDay();
        
        // Get the last day of the previous month
        const lastDayOfPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
        
        // Render previous month days
        for (let i = 0; i < firstDayOfWeek; i++) {
            const dayNum = lastDayOfPrevMonth - firstDayOfWeek + i + 1;
            const day = document.createElement('div');
            day.className = 'calendar-day other-month';
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = dayNum;
            
            day.appendChild(dayNumber);
            calendarGrid.appendChild(day);
        }
        
        // Render current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day';
            
            // Check if this is today
            const currentDateCheck = new Date(currentYear, currentMonth, i);
            if (currentDateCheck.toDateString() === new Date().toDateString()) {
                day.classList.add('today');
            }
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = i;
            
            day.appendChild(dayNumber);
            
            // Add date data for selection
            const date = new Date(currentYear, currentMonth, i);
            day.dataset.date = date.toISOString().split('T')[0];
            
            // Check if this day has availability
            const dateKey = `${currentYear}-${currentMonth + 1}-${i}`;
            
            if (savedAvailability[dateKey] && savedAvailability[dateKey].length > 0) {
                day.classList.add('has-availability');
                
                // Add availability indicator
                const availabilityIndicator = document.createElement('div');
                availabilityIndicator.className = 'availability-indicator';
                availabilityIndicator.title = `${savedAvailability[dateKey].length} available time slots`;
                day.appendChild(availabilityIndicator);
                
                // Add click event to show booking popup with available time slots
                day.addEventListener('click', function() {
                    // Format the date for display
                    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                    const displayDate = date.toLocaleDateString('en-US', options);
                    
                    // Update selected date elements
                    document.querySelectorAll('.selected-date').forEach(el => {
                        el.textContent = displayDate;
                    });
                    
                    // Store selected date
                    selectedDate = date;
                    
                    // Get available time slots for this date
                    const availableTimeSlots = savedAvailability[dateKey];
                    
                    // Update time slots in the popup
                    const timeSlotsContainer = document.querySelector('.time-slots-container');
                    if (timeSlotsContainer) {
                        timeSlotsContainer.innerHTML = '';
                        
                        // Add available time slots
                        availableTimeSlots.forEach(slot => {
                            const timeSlotEl = document.createElement('div');
                            timeSlotEl.className = 'time-slot-option';
                            timeSlotEl.textContent = slot;
                            timeSlotEl.addEventListener('click', function() {
                                // Remove selected class from all time slots
                                document.querySelectorAll('.time-slot-option').forEach(s => {
                                    s.classList.remove('selected');
                                });
                                
                                // Add selected class to clicked time slot
                                this.classList.add('selected');
                                selectedTimeSlot = slot;
                            });
                            timeSlotsContainer.appendChild(timeSlotEl);
                        });
                    }
                    
                    // Remove selected class from all days
                    document.querySelectorAll('.calendar-day').forEach(d => {
                        d.classList.remove('selected');
                    });
                    
                    // Add selected class to clicked day
                    this.classList.add('selected');
                    
                    // Show booking popup with smooth animation
                    const popup = document.getElementById('booking-popup-overlay');
                    if (popup) {
                        popup.style.display = 'flex';
                        // Trigger reflow to ensure the transition works
                        void popup.offsetWidth;
                        popup.classList.add('active');
                    }
                });
            } else {
                day.classList.add('no-availability');
                
                // Add click event to show a message that no availability exists
                day.addEventListener('click', function() {
                    // Remove selected class from all days
                    document.querySelectorAll('.calendar-day').forEach(d => {
                        d.classList.remove('selected');
                    });
                    
                    // Add selected class to clicked day
                    this.classList.add('selected');
                    
                    // Show a message that no availability exists
                    alert('No availability for this date. Please select another date.');
                });
            }
            
            calendarGrid.appendChild(day);
        }
        
        // Render next month days to fill the remaining cells
        const remainingCells = 42 - (firstDayOfWeek + daysInMonth); // 6 rows * 7 days = 42
        for (let i = 1; i <= remainingCells; i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day other-month';
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = i;
            
            day.appendChild(dayNumber);
            calendarGrid.appendChild(day);
        }
    }
    
    // Render week view calendar
    function renderWeekView() {
        if (!calendarGrid) return;
        calendarGrid.innerHTML = '';
        
        // Get start of the week containing the current date
        const startOfWeek = getStartOfWeek(currentDate);
        
        // Add time column header
        const timeHeader = document.createElement('div');
        timeHeader.className = 'day-header time-header';
        timeHeader.textContent = 'Time';
        calendarGrid.appendChild(timeHeader);
        
        // Add day headers
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + i);
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = formatDayHeader(day);
            
            // Highlight today
            if (day.toDateString() === new Date().toDateString()) {
                dayHeader.classList.add('today');
            }
            
            calendarGrid.appendChild(dayHeader);
        }
        
        // Add time slots
        for (let hour = 9; hour <= 17; hour++) { // 9 AM to 5 PM
            // Add hour label
            const hourLabel = document.createElement('div');
            hourLabel.className = 'hour-label';
            hourLabel.textContent = formatHour(hour);
            calendarGrid.appendChild(hourLabel);
            
            // Add time slots for each day
            for (let day = 0; day < 7; day++) {
                const currentDay = new Date(startOfWeek);
                currentDay.setDate(currentDay.getDate() + day);
                currentDay.setHours(hour, 0, 0, 0);
                
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                timeSlot.dataset.datetime = currentDay.toISOString();
                
                // Check if this time slot is available
                timeSlot.addEventListener('click', function() {
                    // Format the date for display
                    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                    const displayDate = currentDay.toLocaleDateString('en-US', options);
                    const displayTime = formatHour(hour);
                    
                    // Update selected date and time elements
                    document.querySelectorAll('.selected-date').forEach(el => {
                        el.textContent = displayDate;
                    });
                    
                    // Store selected date
                    selectedDate = new Date(currentDay);
                    selectedTimeSlot = displayTime;
                    
                    // Show booking popup
                    const popup = document.getElementById('booking-popup-overlay');
                    if (popup) {
                        popup.style.display = 'flex';
                    }
                });
                
                calendarGrid.appendChild(timeSlot);
            }
        }
    }
    
    // Helper function to get the start of the week (Sunday) for a given date
    function getStartOfWeek(date) {
        const result = new Date(date);
        const day = result.getDay();
        result.setDate(result.getDate() - day);
        return result;
    }
    
    // Helper function to format hour (e.g., "9:00 AM")
    function formatHour(hour) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour;
        return `${displayHour}:00 ${period}`;
    }
    
    // Helper function to format date (e.g., "May 16, 2025")
    function formatDate(date) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
    
    // Helper function to format day header for week view (e.g., "Sun 10")
    function formatDayHeader(date) {
        return `${daysOfWeek[date.getDay()]} ${date.getDate()}`;
    }
}
