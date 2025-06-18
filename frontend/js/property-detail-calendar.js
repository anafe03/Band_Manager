// js/property-detail-calendar.js
// Fixed Calendar integration with Supabase for property detail page

class PropertyCalendarManager {
    constructor(propertyId) {
        this.supabaseUrl = window.SUPABASE_CONFIG.url;
        this.supabaseKey = window.SUPABASE_CONFIG.key;
        this.propertyId = propertyId;
        this.availability = [];
        this.bookings = [];
        this.currentDate = new Date();
        this.selectedDate = null;
        this.init();
    }

    async init() {
        console.log('📅 Initializing calendar for property:', this.propertyId);
        try {
            await this.loadAvailabilityData();
            await this.loadBookingsData();
            this.renderCalendar();
        } catch (error) {
            console.error('❌ Error initializing calendar:', error);
        }
    }

    async loadAvailabilityData() {
        console.log('📅 Loading availability data...');
        
        // CORRECTED: Using your actual table structure
        const endpoint = `${this.supabaseUrl}/rest/v1/availability?select=*&listing_id=eq.${this.propertyId}`;
        
        try {
            const response = await fetch(endpoint, {
                headers: {
                    apikey: this.supabaseKey,
                    Authorization: `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.availability = await response.json();
                console.log('✅ Availability loaded:', this.availability);
            } else {
                console.warn('⚠️ No availability data found. Response:', await response.text());
                this.availability = [];
            }
        } catch (error) {
            console.error('❌ Error loading availability:', error);
            this.availability = [];
        }
    }

    async loadBookingsData() {
        console.log('📝 Loading bookings data...');
        
        // CORRECTED: Using your actual table structure (assuming bookings table uses listing_id)
        const endpoint = `${this.supabaseUrl}/rest/v1/bookings?select=*&listing_id=eq.${this.propertyId}`;
        
        try {
            const response = await fetch(endpoint, {
                headers: {
                    apikey: this.supabaseKey,
                    Authorization: `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.bookings = await response.json();
                console.log('✅ Bookings loaded:', this.bookings);
            } else {
                console.warn('⚠️ No bookings data found');
                this.bookings = [];
            }
        } catch (error) {
            console.error('❌ Error loading bookings:', error);
            this.bookings = [];
        }
    }

    hasAvailabilityForDate(date) {
        const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // FIXED: Look for availability records for this specific date
        const availabilityForDate = this.availability.filter(avail => avail.date === dateString);
        
        if (availabilityForDate.length === 0) {
            return false; // No availability record for this date
        }

        // Check if any time slots are still available (not fully booked)
        const availableSlots = this.getAvailableTimeSlotsForDate(dateString);
        return availableSlots.length > 0;
    }

    getAvailableTimeSlotsForDate(dateString) {
        // CORRECTED: Get availability record for this date (your structure has one record per date with time_slots JSONB)
        const availability = this.availability.find(avail => avail.date === dateString);
        
        if (!availability || !availability.time_slots) {
            return [];
        }

        // CORRECTED: Handle time_slots as JSONB array
        let availableSlots = [];
        
        if (Array.isArray(availability.time_slots)) {
            availableSlots = [...availability.time_slots];
        } else if (typeof availability.time_slots === 'object') {
            // Handle case where it might be stored as object
            availableSlots = Object.values(availability.time_slots);
        }

        // Remove booked time slots
        const bookedSlots = this.bookings
            .filter(booking => booking.date === dateString && booking.status !== 'cancelled')
            .map(booking => booking.time);

        return availableSlots.filter(slot => !bookedSlots.includes(slot));
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update period display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        
        const currentPeriodElement = document.getElementById('current-period');
        if (currentPeriodElement) {
            currentPeriodElement.textContent = `${monthNames[month]} ${year}`;
        }
        
        // Generate calendar grid
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        let calendarHTML = '';
        
        // Day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            calendarHTML += `<div class="day-header">${day}</div>`;
        });
        
        // Previous month days (empty cells)
        for (let i = 0; i < startingDayOfWeek; i++) {
            calendarHTML += `<div class="calendar-day other-month" style="visibility: hidden;"></div>`;
        }
        
        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const today = new Date();
            const isPast = date < today.setHours(0, 0, 0, 0);
            const hasAvailability = this.hasAvailabilityForDate(date);
            
            let classes = 'calendar-day';
            let clickable = false;
            
            if (isPast) {
                classes += ' past-date';
            } else if (hasAvailability) {
                classes += ' has-availability';
                clickable = true;
            } else {
                classes += ' no-availability';
            }
            
            // FIXED: Proper date string formatting and click handler
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Add click handler and cursor pointer for clickable days
            const clickHandler = clickable ? `onclick="selectCalendarDate('${dateString}')" style="cursor: pointer;"` : '';
            
            calendarHTML += `
                <div class="${classes}" data-date="${dateString}" ${clickHandler}>
                    <div class="day-number">${day}</div>
                    ${hasAvailability ? '<div class="availability-indicator"></div>' : ''}
                </div>
            `;
        }
        
        // Fill remaining cells for complete grid (empty cells)
        const totalCellsUsed = startingDayOfWeek + daysInMonth;
        const totalRows = Math.ceil(totalCellsUsed / 7);
        const totalCells = totalRows * 7;
        const remainingCells = totalCells - totalCellsUsed;
        
        for (let i = 0; i < remainingCells; i++) {
            calendarHTML += `<div class="calendar-day other-month" style="visibility: hidden;"></div>`;
        }
        
        const calendarGrid = document.getElementById('calendar-grid');
        if (calendarGrid) {
            calendarGrid.innerHTML = calendarHTML;
            console.log('📅 Calendar rendered with', this.availability.length, 'availability records');
            console.log('📅 Available dates this month:', this.getAvailableDatesThisMonth());
        }
    }

    // Helper method to debug available dates
    getAvailableDatesThisMonth() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const availableDates = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            if (this.hasAvailabilityForDate(date)) {
                availableDates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
            }
        }
        
        return availableDates;
    }

    navigateCalendar(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    selectDate(dateString) {
        console.log('📅 Date selected:', dateString);
        
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
        const today = new Date();
        
        console.log('📅 Parsed date:', date);
        console.log('📅 Today:', today);
        console.log('📅 Has availability:', this.hasAvailabilityForDate(date));
        
        if (date < today.setHours(0, 0, 0, 0)) {
            alert('Please select a future date.');
            return;
        }
        
        if (!this.hasAvailabilityForDate(date)) {
            alert('No availability on this date. Please select another date.');
            return;
        }
        
        this.selectedDate = date;
        console.log('📅 Opening booking popup for:', date);
        this.showBookingPopup(date);
    }

    showBookingPopup(date) {
        console.log('📅 Showing booking popup for:', date);
        
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const selectedDateElement = document.getElementById('selected-date');
        if (selectedDateElement) {
            selectedDateElement.textContent = formattedDate;
            console.log('📅 Updated selected date display:', formattedDate);
        } else {
            console.warn('❌ Could not find selected-date element');
        }
        
        // Generate time slots from database
        this.generateTimeSlotsFromDatabase(date);
        
        // Show popup using the CSS classes your stylesheet expects
        const popup = document.getElementById('booking-popup-overlay');
        console.log('📅 Popup element found:', !!popup);
        
        if (popup) {
            // Remove any conflicting inline styles first
            popup.removeAttribute('style');
            
            // Add the 'active' class that your CSS expects
            popup.classList.add('active');
            
            // Also force with inline styles as backup
            popup.style.cssText = `
                display: flex !important;
                opacity: 1 !important;
                visibility: visible !important;
            `;
            
            document.body.style.overflow = 'hidden';
            console.log('📅 Booking popup should now be visible with active class');
            
        } else {
            console.error('❌ Could not find booking popup element with ID: booking-popup-overlay');
            alert('Booking popup not found. Please refresh the page and try again.');
        }
    }

    generateTimeSlotsFromDatabase(date) {
        const dateString = date.toISOString().split('T')[0];
        const availableSlots = this.getAvailableTimeSlotsForDate(dateString);
        
        const container = document.getElementById('time-slots-container');
        if (!container) return;
        
        if (availableSlots.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 20px; color: #666;">
                    <i class="fas fa-clock" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>No time slots available for this date.</p>
                </div>
            `;
            return;
        }
        
        // FIXED: Format time slots properly without duplicate AM/PM
        container.innerHTML = availableSlots.map(time => {
            const displayTime = this.formatTimeForDisplay(time);
            
            return `
                <div class="time-slot-option" onclick="selectTimeSlot(this)" data-time="${time}">
                    ${displayTime}
                </div>
            `;
        }).join('');
    }

    selectTimeSlot(element) {
        console.log('🕐 Time slot selected:', element.dataset.time);
        
        // Remove selection from all slots
        document.querySelectorAll('.time-slot-option').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        // Add selection to clicked slot
        element.classList.add('selected');
        
        // Visual feedback
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 150);
    }

    closeBookingPopup() {
        const popup = document.getElementById('booking-popup-overlay');
        if (popup) {
            // Remove the active class that shows the popup
            popup.classList.remove('active');
            
            // Also clear any inline styles
            popup.removeAttribute('style');
            
            document.body.style.overflow = 'auto';
        }
        
        // Reset form
        const form = document.querySelector('.booking-form');
        if (form) {
            form.reset();
        }
        
        // Clear selected time slot
        document.querySelectorAll('.time-slot-option').forEach(slot => {
            slot.classList.remove('selected');
        });
    }

    async submitBooking(event) {
        event.preventDefault();
        console.log('📅 Starting booking submission...');
        
        const selectedTimeSlot = document.querySelector('.time-slot-option.selected');
        if (!selectedTimeSlot) {
            alert('Please select a time slot.');
            return;
        }
        
        const formData = new FormData(event.target);
        
        // FIXED: Match your exact bookings table schema
        const bookingData = {
            listing_id: this.propertyId, // UUID from your listings table
            visitor_name: formData.get('visitor-name'),
            visitor_email: formData.get('visitor-email'),
            visitor_phone: formData.get('visitor-phone'),
            date: this.selectedDate.toISOString().split('T')[0], // YYYY-MM-DD format
            time: selectedTimeSlot.dataset.time, // e.g., "14:00"
            agent_status: 'non-agent', // Default value, you can add form field if needed
            preapproved: false, // Default value, you can add form field if needed
            status: 'pending', // Default status for new bookings
            special_requests: formData.get('special-requests') || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        console.log('📅 Booking data to submit:', bookingData);
        
        // Show loading state
        const submitButton = event.target.querySelector('.book-now-btn');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitButton.disabled = true;
        
        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/bookings`, {
                method: 'POST',
                headers: {
                    apikey: this.supabaseKey,
                    Authorization: `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                    Prefer: 'return=representation'
                },
                body: JSON.stringify(bookingData)
            });
            
            console.log('📅 Booking response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Booking created successfully:', result);
                
                // Send email notifications
                await this.sendBookingEmails(bookingData, result[0]);
                
                // Refresh bookings data and calendar
                await this.loadBookingsData();
                this.renderCalendar();
                
                // Show success message
                alert(`✅ Booking confirmed!\n\nProperty viewing scheduled for:\n${this.selectedDate.toLocaleDateString()} at ${this.formatTimeForDisplay(selectedTimeSlot.dataset.time)}\n\nConfirmation emails have been sent!\n\nWe will contact you shortly to confirm the details.`);
                
                this.closeBookingPopup();
            } else {
                const errorText = await response.text();
                console.error('❌ Booking submission failed:', response.status, errorText);
                
                // Try to parse error for better user message
                let errorMessage = 'Failed to submit booking. Please try again.';
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (e) {
                    // Use default message if can't parse error
                }
                
                alert(errorMessage);
            }
        } catch (error) {
            console.error('❌ Booking submission error:', error);
            alert('Network error. Please check your connection and try again.');
        } finally {
            // Restore button state
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

    // Helper method to format time for display
    formatTimeForDisplay(time24) {
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    // Method to refresh calendar data
    async refreshCalendar() {
        await this.loadAvailabilityData();
        await this.loadBookingsData();
        this.renderCalendar();
    }

    // NEW: Send booking confirmation emails
    async sendBookingEmails(bookingData, bookingResult) {
        console.log('📧 Sending booking confirmation emails...');
        
        try {
            // Get property and owner information
            const propertyInfo = await this.getPropertyAndOwnerInfo(bookingData.listing_id);
            
            if (!propertyInfo) {
                console.warn('⚠️ Could not get property owner info for email');
                return;
            }

            // Prepare email data
            const emailData = {
                booking: {
                    ...bookingData,
                    id: bookingResult.id,
                    formatted_date: this.selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    formatted_time: this.formatTimeForDisplay(bookingData.time)
                },
                property: propertyInfo.property,
                owner: propertyInfo.owner,
                visitor: {
                    name: bookingData.visitor_name,
                    email: bookingData.visitor_email,
                    phone: bookingData.visitor_phone
                }
            };

            // Send emails (you'll need to implement based on your email service)
            await this.sendEmails(emailData);
            
        } catch (error) {
            console.error('❌ Error sending emails:', error);
            // Don't fail the booking if emails fail
        }
    }

    // Get property and owner information for emails
    async getPropertyAndOwnerInfo(listingId) {
        try {
            // First get the listing
            console.log('📧 Fetching listing info for:', listingId);
            const listingEndpoint = `${this.supabaseUrl}/rest/v1/listings?select=*&id=eq.${listingId}`;
            
            const listingResponse = await fetch(listingEndpoint, {
                headers: {
                    apikey: this.supabaseKey,
                    Authorization: `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!listingResponse.ok) {
                console.error('❌ Failed to fetch listing:', await listingResponse.text());
                return null;
            }

            const listingData = await listingResponse.json();
            if (listingData.length === 0) {
                console.warn('⚠️ No listing found with ID:', listingId);
                return null;
            }

            const listing = listingData[0];
            console.log('📧 Listing found:', listing.title);
            console.log('📧 Listing user_id:', listing.user_id);

            // Check if listing has an owner assigned
            if (!listing.user_id) {
                console.error('❌ This listing has no owner assigned (user_id is null)');
                console.error('🔧 Fix this by updating the listing in your database:');
                console.error(`   UPDATE listings SET user_id = 'your-user-uuid' WHERE id = '${listingId}';`);
                return null;
            }

            // Now get the owner info using the user_id from the listing
            console.log('📧 Fetching owner info for user_id:', listing.user_id);
            console.log('📧 User query URL:', `${this.supabaseUrl}/rest/v1/users?select=id,email,full_name&id=eq.${listing.user_id}`);
            
            const userEndpoint = `${this.supabaseUrl}/rest/v1/users?select=id,email,full_name&id=eq.${listing.user_id}`;
            
            const userResponse = await fetch(userEndpoint, {
                headers: {
                    apikey: this.supabaseKey,
                    Authorization: `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📧 User response status:', userResponse.status);
            const userResponseText = await userResponse.text();
            console.log('📧 User response body:', userResponseText);

            if (!userResponse.ok) {
                console.error('❌ Failed to fetch user - Status:', userResponse.status);
                console.error('❌ Response:', userResponseText);
                return null;
            }

            let userData;
            try {
                userData = JSON.parse(userResponseText);
            } catch (e) {
                console.error('❌ Failed to parse user response as JSON:', e);
                return null;
            }

            console.log('📧 Parsed user data:', userData);

            if (!userData || userData.length === 0) {
                console.warn('⚠️ No user found with ID:', listing.user_id);
                console.error('🔧 The user_id exists but no user record found. Check your users table.');
                return null;
            }

            const owner = userData[0];
            console.log('✅ Owner found:', owner.full_name, owner.email);

            return {
                property: listing,
                owner: owner
            };
            
        } catch (error) {
            console.error('❌ Error getting property info:', error);
            return null;
        }
    }

    // Send emails using your preferred service
    async sendEmails(emailData) {
        // Option 1: Supabase Edge Function (recommended)
        await this.sendViaSupabaseFunction(emailData);
        
        // Option 2: External email service
        // await this.sendViaExternalService(emailData);
    }

    // Send emails via Supabase Edge Function
    async sendViaSupabaseFunction(emailData) {
        try {
            const response = await fetch(`${this.supabaseUrl}/functions/v1/send-booking-emails`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });

            if (response.ok) {
                console.log('✅ Emails sent successfully');
            } else {
                console.warn('⚠️ Email sending failed:', await response.text());
            }
        } catch (error) {
            console.error('❌ Error calling email function:', error);
        }
    }

    // Alternative: Send via external email service
    async sendViaExternalService(emailData) {
        // Example for SendGrid, Mailgun, etc.
        // You would implement this based on your chosen service
        console.log('📧 Would send emails via external service:', emailData);
    }
}

// Global calendar instance (will be initialized when property loads)
let propertyCalendar = null;

// Global functions for HTML onclick handlers
function navigateCalendar(direction) {
    if (propertyCalendar) {
        propertyCalendar.navigateCalendar(direction);
    } else {
        console.error('❌ Property calendar not initialized');
    }
}

function closeBookingPopup() {
    if (propertyCalendar) {
        propertyCalendar.closeBookingPopup();
    } else {
        console.error('❌ Property calendar not initialized');
    }
}

function submitBooking(event) {
    if (propertyCalendar) {
        propertyCalendar.submitBooking(event);
    } else {
        console.error('❌ Property calendar not initialized');
    }
}

// NEW: Global function for calendar date selection
function selectCalendarDate(dateString) {
    console.log('🗓️ Global selectCalendarDate called with:', dateString);
    if (propertyCalendar) {
        propertyCalendar.selectDate(dateString);
    } else {
        console.error('❌ Property calendar not initialized');
        alert('Calendar not ready. Please refresh the page and try again.');
    }
}

// NEW: Global function for time slot selection
function selectTimeSlot(element) {
    console.log('🕐 Global selectTimeSlot called');
    if (propertyCalendar) {
        propertyCalendar.selectTimeSlot(element);
    } else {
        console.error('❌ Property calendar not initialized');
    }
}

// Make functions globally available
window.navigateCalendar = navigateCalendar;
window.closeBookingPopup = closeBookingPopup;
window.submitBooking = submitBooking;
window.selectCalendarDate = selectCalendarDate;
window.selectTimeSlot = selectTimeSlot;

// Initialize calendar when property loader is ready
document.addEventListener('DOMContentLoaded', function() {
    // Get property ID directly from URL as fallback
    const urlParams = new URLSearchParams(window.location.search);
    const propertyIdFromUrl = urlParams.get('id');
    
    if (propertyIdFromUrl) {
        console.log('🚀 Initializing property calendar with URL ID:', propertyIdFromUrl);
        propertyCalendar = new PropertyCalendarManager(propertyIdFromUrl);
        
        // Make sure it's globally available
        window.propertyCalendar = propertyCalendar;
    } else {
        // Wait for property loader to be ready
        const checkPropertyLoader = setInterval(() => {
            if (window.propertyLoader && window.propertyLoader.propertyId) {
                console.log('🚀 Initializing property calendar with loader ID...');
                propertyCalendar = new PropertyCalendarManager(window.propertyLoader.propertyId);
                window.propertyCalendar = propertyCalendar;
                clearInterval(checkPropertyLoader);
            }
        }, 100);
        
        // Fallback timeout
        setTimeout(() => {
            clearInterval(checkPropertyLoader);
            if (!propertyCalendar) {
                console.warn('⚠️ Property calendar initialization timed out');
                // Try one more time with URL
                if (propertyIdFromUrl) {
                    console.log('🔄 Retry: Initializing calendar with URL ID');
                    propertyCalendar = new PropertyCalendarManager(propertyIdFromUrl);
                    window.propertyCalendar = propertyCalendar;
                }
            }
        }, 3000);
    }
    
    // Listen for refresh events from assistant calendar
    document.addEventListener('propertyCalendarRefresh', function(event) {
        console.log('📅 Property calendar refresh event received:', event.detail);
        if (propertyCalendar && typeof propertyCalendar.refreshCalendar === 'function') {
            console.log('📅 Refreshing property calendar due to availability update');
            propertyCalendar.refreshCalendar();
        }
    });
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PropertyCalendarManager;
}