/**
 * Database Availability Sync - Enhanced version with Supabase integration
 * This script provides database-backed availability management for the assistant.html calendar popout
 * Works with existing 'availability' and 'bookings' tables in Supabase
 */

class DatabaseAvailabilitySync {
    constructor() {
        this.supabaseUrl = window.SUPABASE_CONFIG?.url;
        this.supabaseKey = window.SUPABASE_CONFIG?.key;
        this.currentUser = null;
        this.currentListingId = null;
        this.isInitialized = false;
        console.log('🔧 Database Availability Sync constructor called');
        this.init();
    }

    async init() {
        console.log('🔧 Database Availability Sync initializing...');
        
        try {
            // Wait for Supabase to be available
            await this.waitForSupabase();
            console.log('✅ Supabase available');
            
            // Get current user
            await this.getCurrentUser();
            console.log('✅ User checked:', this.currentUser ? this.currentUser.email : 'Not authenticated');
            
            // Get current listing ID for this user
            await this.getCurrentListingId();
            console.log('✅ Listing ID:', this.currentListingId);
            
            this.isInitialized = true;
            console.log('✅ Database Availability Sync ready');
            
            // Listen for availability changes
            this.setupEventListeners();
            
        } catch (error) {
            console.error('❌ Error initializing Database Availability Sync:', error);
        }
    }

    async waitForSupabase() {
        let attempts = 0;
        while (typeof window.supabase === 'undefined' && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof window.supabase === 'undefined') {
            throw new Error('Supabase not loaded');
        }
    }

    async getCurrentUser() {
        try {
            const { data: { user }, error } = await window.supabase.auth.getUser();
            if (error) {
                console.warn('⚠️ Error getting current user:', error);
                return;
            }
            this.currentUser = user;
            console.log('👤 Current user:', user?.email);
        } catch (error) {
            console.error('❌ Error getting current user:', error);
        }
    }

    async getCurrentListingId() {
        if (!this.currentUser) {
            console.warn('⚠️ No authenticated user, cannot get listing ID');
            return;
        }

        try {
            // Get the user's active listing
            const { data, error } = await window.supabase
                .from('listings')
                .select('id')
                .eq('user_id', this.currentUser.id)
                .eq('status', 'active')
                .limit(1);

            if (error) {
                console.error('❌ Error getting listing ID:', error);
                return;
            }

            if (data && data.length > 0) {
                this.currentListingId = data[0].id;
                console.log('🏠 Found listing ID:', this.currentListingId);
            } else {
                console.warn('⚠️ No active listing found for user');
            }
        } catch (error) {
            console.error('❌ Error getting listing ID:', error);
        }
    }

    setupEventListeners() {
        // Listen for calendar events that need database sync
        document.addEventListener('calendarAvailabilitySave', async (event) => {
            const { date, timeSlots } = event.detail;
            await this.saveAvailabilityToDatabase(date, timeSlots);
        });

        document.addEventListener('calendarAvailabilityRemove', async (event) => {
            const { date, timeSlot } = event.detail;
            await this.removeAvailabilityFromDatabase(date, timeSlot);
        });
    }

    /**
     * Save availability to database
     * @param {Date} date - The date to save availability for
     * @param {Array} timeSlots - Array of time slots
     */
    async saveAvailabilityToDatabase(date, timeSlots) {
        console.log('🔧 saveAvailabilityToDatabase called with:', { date, timeSlots });
        console.log('🔧 Current state:', {
            isInitialized: this.isInitialized,
            currentUser: this.currentUser?.email,
            currentListingId: this.currentListingId,
            supabaseAvailable: !!window.supabase
        });

        if (!this.isInitialized) {
            console.warn('⚠️ Database sync not initialized, using localStorage fallback');
            this.saveToLocalStorage(date, timeSlots);
            throw new Error('Database sync not initialized');
        }

        if (!window.supabase) {
            console.error('❌ Supabase client not available');
            throw new Error('Database connection not available');
        }

        if (!this.currentUser) {
            console.error('❌ User not authenticated');
            throw new Error('User not authenticated. Please log in to save availability to database.');
        }

        if (!this.currentListingId) {
            console.error('❌ No listing ID available - user may not have created a listing yet');
            console.log('🔧 Attempting to get listing ID again...');
            await this.getCurrentListingId();
            
            if (!this.currentListingId) {
                // Still save to localStorage as fallback
                this.saveToLocalStorage(date, timeSlots);
                throw new Error('No property listing found. Please create a listing first to save availability to database.');
            }
        }

        console.log('💾 Saving availability to database:', { date, timeSlots, listingId: this.currentListingId });

        try {
            const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format

            // Check if availability record already exists for this date
            const { data: existingData, error: checkError } = await window.supabase
                .from('availability')
                .select('*')
                .eq('listing_id', this.currentListingId)
                .eq('user_id', this.currentUser.id)
                .eq('date', dateString)
                .limit(1);

            if (checkError) {
                console.error('❌ Error checking existing availability:', checkError);
                throw checkError;
            }

            let result;

            if (existingData && existingData.length > 0) {
                // Update existing record
                console.log('📝 Updating existing availability record');
                const { data, error } = await window.supabase
                    .from('availability')
                    .update({ 
                        time_slots: timeSlots,
                        updated_at: new Date().toISOString()
                    })
                    .eq('listing_id', this.currentListingId)
                    .eq('user_id', this.currentUser.id)
                    .eq('date', dateString)
                    .select();

                if (error) throw error;
                result = data;
            } else {
                // Create new record
                console.log('📝 Creating new availability record');
                const { data, error } = await window.supabase
                    .from('availability')
                    .insert([{
                        listing_id: this.currentListingId,
                        user_id: this.currentUser.id,
                        date: dateString,
                        time_slots: timeSlots,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }])
                    .select();

                if (error) throw error;
                result = data;
            }

            console.log('✅ Availability saved to database:', result);
            
            // Also save to localStorage as backup
            this.saveToLocalStorage(date, timeSlots);
            
            // Dispatch event for UI updates
            this.dispatchAvailabilityChangedEvent(date, timeSlots);

            return result;
        } catch (error) {
            console.error('❌ Error saving availability to database:', error);
            // Fallback to localStorage
            this.saveToLocalStorage(date, timeSlots);
            throw error;
        }
    }

    /**
     * Load availability from database
     */
    async loadAvailabilityFromDatabase() {
        if (!this.isInitialized) {
            console.warn('⚠️ Database sync not initialized, using localStorage fallback');
            return this.loadFromLocalStorage();
        }

        if (!this.currentListingId) {
            console.warn('⚠️ No listing ID available, falling back to localStorage');
            return this.loadFromLocalStorage();
        }

        try {
            console.log('📅 Loading availability from database for listing:', this.currentListingId);

            const { data, error } = await window.supabase
                .from('availability')
                .select('*')
                .eq('listing_id', this.currentListingId)
                .eq('user_id', this.currentUser.id)
                .order('date', { ascending: true });

            if (error) throw error;

            console.log('📅 Loaded availability from database:', data);

            // Convert to the format expected by the calendar
            const availability = {};
            if (data && data.length > 0) {
                data.forEach(slot => {
                    const dateKey = this.formatDateKey(new Date(slot.date));
                    availability[dateKey] = slot.time_slots || [];
                });
            }

            // Also save to localStorage as backup
            localStorage.setItem('savedAvailability', JSON.stringify(availability));

            return availability;
        } catch (error) {
            console.error('❌ Error loading availability from database:', error);
            // Fallback to localStorage
            return this.loadFromLocalStorage();
        }
    }

    /**
     * Remove availability from database
     * @param {Date} date - Date to remove availability for
     * @param {string} timeSlot - Specific time slot to remove (optional)
     */
    async removeAvailabilityFromDatabase(date, timeSlot = null) {
        if (!this.isInitialized || !this.currentUser || !this.currentListingId) {
            console.warn('⚠️ Database not available, using localStorage fallback');
            this.removeFromLocalStorage(date, timeSlot);
            return;
        }

        try {
            const dateString = date.toISOString().split('T')[0];

            if (timeSlot) {
                // Remove specific time slot
                console.log('🗑️ Removing specific time slot from database:', { date: dateString, timeSlot });

                // Get current time slots
                const { data: existingData, error: fetchError } = await window.supabase
                    .from('availability')
                    .select('time_slots')
                    .eq('listing_id', this.currentListingId)
                    .eq('date', dateString)
                    .limit(1);

                if (fetchError) throw fetchError;

                if (existingData && existingData.length > 0) {
                    const currentSlots = existingData[0].time_slots || [];
                    const updatedSlots = currentSlots.filter(slot => slot !== timeSlot);

                    if (updatedSlots.length === 0) {
                        // Remove entire record if no time slots left
                        const { error } = await window.supabase
                            .from('availability')
                            .delete()
                            .eq('listing_id', this.currentListingId)
                            .eq('date', dateString);

                        if (error) throw error;
                    } else {
                        // Update with remaining time slots
                        const { error } = await window.supabase
                            .from('availability')
                            .update({ 
                                time_slots: updatedSlots,
                                updated_at: new Date().toISOString()
                            })
                            .eq('listing_id', this.currentListingId)
                            .eq('date', dateString);

                        if (error) throw error;
                    }
                }
            } else {
                // Remove entire date
                console.log('🗑️ Removing entire date from database:', dateString);

                const { error } = await window.supabase
                    .from('availability')
                    .delete()
                    .eq('listing_id', this.currentListingId)
                    .eq('date', dateString);

                if (error) throw error;
            }

            console.log('✅ Removed availability from database');
            
            // Also update localStorage
            this.removeFromLocalStorage(date, timeSlot);
            
            // Dispatch event for UI updates
            this.dispatchAvailabilityChangedEvent(date, null, true);

        } catch (error) {
            console.error('❌ Error removing availability from database:', error);
            // Fallback to localStorage
            this.removeFromLocalStorage(date, timeSlot);
            throw error;
        }
    }

    // Utility methods for localStorage backup
    saveToLocalStorage(date, timeSlots) {
        const dateKey = this.formatDateKey(date);
        const savedAvailability = this.loadFromLocalStorage();
        savedAvailability[dateKey] = timeSlots;
        localStorage.setItem('savedAvailability', JSON.stringify(savedAvailability));
        console.log('💾 Saved to localStorage as backup:', { dateKey, timeSlots });
    }

    loadFromLocalStorage() {
        const savedData = localStorage.getItem('savedAvailability');
        return savedData ? JSON.parse(savedData) : {};
    }

    removeFromLocalStorage(date, timeSlot = null) {
        const dateKey = this.formatDateKey(date);
        const savedAvailability = this.loadFromLocalStorage();
        
        if (timeSlot && savedAvailability[dateKey]) {
            savedAvailability[dateKey] = savedAvailability[dateKey].filter(slot => slot !== timeSlot);
            if (savedAvailability[dateKey].length === 0) {
                delete savedAvailability[dateKey];
            }
        } else {
            delete savedAvailability[dateKey];
        }
        
        localStorage.setItem('savedAvailability', JSON.stringify(savedAvailability));
    }

    formatDateKey(date) {
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }

    dispatchAvailabilityChangedEvent(date, timeSlots, removed = false) {
        const event = new CustomEvent('availabilityChanged', {
            detail: { 
                date, 
                timeSlots, 
                removed,
                source: 'database',
                timestamp: Date.now() 
            }
        });
        document.dispatchEvent(event);
    }
}

// Initialize the database availability sync
let databaseAvailabilitySync;
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 DOM loaded, initializing Database Availability Sync');
    databaseAvailabilitySync = new DatabaseAvailabilitySync();
    
    // Make it globally available
    window.databaseAvailabilitySync = databaseAvailabilitySync;
});

// Enhanced global functions that use database when available
window.addAvailability = async function(date, timeSlots) {
    console.log('🔧 addAvailability called:', { date, timeSlots });
    try {
        if (window.databaseAvailabilitySync && window.databaseAvailabilitySync.isInitialized) {
            await window.databaseAvailabilitySync.saveAvailabilityToDatabase(date, timeSlots);
        } else {
            console.warn('⚠️ Database sync not available, using localStorage fallback');
            // Fallback to localStorage
            const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
            const savedAvailability = JSON.parse(localStorage.getItem('savedAvailability') || '{}');
            savedAvailability[dateKey] = timeSlots;
            localStorage.setItem('savedAvailability', JSON.stringify(savedAvailability));
        }
    } catch (error) {
        console.error('❌ Error adding availability:', error);
        // Fallback to localStorage on error
        const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        const savedAvailability = JSON.parse(localStorage.getItem('savedAvailability') || '{}');
        savedAvailability[dateKey] = timeSlots;
        localStorage.setItem('savedAvailability', JSON.stringify(savedAvailability));
    }
};

window.getSavedAvailability = async function() {
    console.log('🔧 getSavedAvailability called');
    try {
        if (window.databaseAvailabilitySync && window.databaseAvailabilitySync.isInitialized) {
            return await window.databaseAvailabilitySync.loadAvailabilityFromDatabase();
        } else {
            console.warn('⚠️ Database sync not available, using localStorage fallback');
            // Fallback to localStorage
            const savedData = localStorage.getItem('savedAvailability');
            return savedData ? JSON.parse(savedData) : {};
        }
    } catch (error) {
        console.error('❌ Error getting saved availability:', error);
        // Fallback to localStorage
        const savedData = localStorage.getItem('savedAvailability');
        return savedData ? JSON.parse(savedData) : {};
    }
};

window.removeAvailabilitySlot = async function(dateKey, timeSlot) {
    console.log('🔧 removeAvailabilitySlot called:', { dateKey, timeSlot });
    try {
        const [year, month, day] = dateKey.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        
        if (window.databaseAvailabilitySync && window.databaseAvailabilitySync.isInitialized) {
            await window.databaseAvailabilitySync.removeAvailabilityFromDatabase(date, timeSlot);
        } else {
            console.warn('⚠️ Database sync not available, using localStorage fallback');
            // Fallback to localStorage
            const savedAvailability = JSON.parse(localStorage.getItem('savedAvailability') || '{}');
            if (savedAvailability[dateKey]) {
                savedAvailability[dateKey] = savedAvailability[dateKey].filter(slot => slot !== timeSlot);
                if (savedAvailability[dateKey].length === 0) {
                    delete savedAvailability[dateKey];
                }
                localStorage.setItem('savedAvailability', JSON.stringify(savedAvailability));
            }
        }
    } catch (error) {
        console.error('❌ Error removing availability slot:', error);
        // Fallback to localStorage
        const savedAvailability = JSON.parse(localStorage.getItem('savedAvailability') || '{}');
        if (savedAvailability[dateKey]) {
            savedAvailability[dateKey] = savedAvailability[dateKey].filter(slot => slot !== timeSlot);
            if (savedAvailability[dateKey].length === 0) {
                delete savedAvailability[dateKey];
            }
            localStorage.setItem('savedAvailability', JSON.stringify(savedAvailability));
        }
    }
}; 