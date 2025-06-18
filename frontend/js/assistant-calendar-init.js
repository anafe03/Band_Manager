/**
 * Assistant Calendar Initialization
 * Ensures the calendar popout in assistant.html properly connects with database sync
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Assistant Calendar Init: DOM loaded');
    
    // Wait for all components to be ready
    setTimeout(initializeAssistantCalendar, 1000);
});

async function initializeAssistantCalendar() {
    console.log('🔧 Initializing Assistant Calendar Integration...');
    
    try {
        // Check if calendar manager is available
        if (window.calendarManager) {
            console.log('✅ Calendar Manager found');
            
            // Initialize the popout calendar
            window.calendarManager.initPopoutCalendar();
            
            // Load saved availability from database
            await window.calendarManager.loadSavedAvailability();
            
            // Render the calendar
            window.calendarManager.renderCalendar();
            
            // Update saved availability display
            window.calendarManager.updateSavedAvailabilityDisplay();
            
            console.log('✅ Assistant Calendar initialized successfully');
        } else {
            console.warn('⚠️ Calendar Manager not found, will retry in 2 seconds');
            setTimeout(initializeAssistantCalendar, 2000);
        }
        
        // Check database connection
        if (window.databaseAvailabilitySync) {
            console.log('✅ Database Availability Sync found');
            if (window.databaseAvailabilitySync.isInitialized) {
                console.log('✅ Database Availability Sync is initialized');
                if (window.databaseAvailabilitySync.currentUser) {
                    console.log('✅ User is authenticated:', window.databaseAvailabilitySync.currentUser.email);
                    if (window.databaseAvailabilitySync.currentListingId) {
                        console.log('✅ Listing ID found:', window.databaseAvailabilitySync.currentListingId);
                        console.log('🎉 Full database integration active!');
                    } else {
                        console.warn('⚠️ No listing ID found - user may need to create a listing first');
                    }
                } else {
                    console.warn('⚠️ User not authenticated - will use localStorage fallback');
                }
            } else {
                console.warn('⚠️ Database Availability Sync not initialized yet');
            }
        } else {
            console.warn('⚠️ Database Availability Sync not found');
        }
        
    } catch (error) {
        console.error('❌ Error initializing Assistant Calendar:', error);
    }
}

// Global function to show calendar popout (called from sidebar menu)
window.showCalendarPopout = function(event) {
    console.log('📅 Calendar popout requested');
    
    const overlay = document.getElementById('calendar-overlay');
    const popout = document.getElementById('calendar-popout');
    
    if (overlay && popout) {
        overlay.style.display = 'block';
        popout.style.display = 'block';
        
        // Initialize calendar if not already done
        if (window.calendarManager) {
            window.calendarManager.initPopoutCalendar();
        }
        
        console.log('✅ Calendar popout displayed');
    } else {
        console.error('❌ Calendar popout elements not found');
    }
};

// Global function to close calendar popout
window.closeCalendarPopout = function() {
    console.log('📅 Closing calendar popout');
    
    const overlay = document.getElementById('calendar-overlay');
    const popout = document.getElementById('calendar-popout');
    
    if (overlay && popout) {
        overlay.style.display = 'none';
        popout.style.display = 'none';
        console.log('✅ Calendar popout closed');
    }
};

// Set up event listeners for calendar popout controls
document.addEventListener('DOMContentLoaded', function() {
    // Close button
    const closeBtn = document.getElementById('close-calendar-popout');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeCalendarPopout);
    }
    
    // Overlay click to close
    const overlay = document.getElementById('calendar-overlay');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeCalendarPopout();
            }
        });
    }
    
    console.log('✅ Calendar popout event listeners set up');
}); 