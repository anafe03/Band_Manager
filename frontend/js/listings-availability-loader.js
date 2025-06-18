/**
 * Listings Availability Loader
 * Loads availability data from Supabase for display on listings.html property detail calendars
 */

class ListingsAvailabilityLoader {
    constructor() {
        this.supabaseUrl = window.SUPABASE_CONFIG?.url;
        this.supabaseKey = window.SUPABASE_CONFIG?.key;
        this.availabilityCache = new Map();
        this.init();
    }

    async init() {
        console.log('📅 Listings Availability Loader initializing...');
        
        try {
            // Wait for Supabase to be available
            await this.waitForSupabase();
            console.log('✅ Supabase available for listings availability');
            
        } catch (error) {
            console.error('❌ Error initializing Listings Availability Loader:', error);
        }
    }

    async waitForSupabase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50;
            
            const check = () => {
                attempts++;
                if (window.supabase && window.SUPABASE_CONFIG) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Supabase not available after maximum attempts'));
                } else {
                    setTimeout(check, 100);
                }
            };
            
            check();
        });
    }

    /**
     * Load availability for a specific listing
     * @param {string} listingId - The listing ID to load availability for
     * @returns {Object} Availability data formatted for calendar display
     */
    async loadListingAvailability(listingId) {
        if (!listingId) {
            console.warn('⚠️ No listing ID provided');
            return {};
        }

        // Check cache first
        if (this.availabilityCache.has(listingId)) {
            console.log('📅 Using cached availability for listing:', listingId);
            return this.availabilityCache.get(listingId);
        }

        try {
            console.log('📅 Loading availability from database for listing:', listingId);

            const { data, error } = await window.supabase
                .from('availability')
                .select('*')
                .eq('listing_id', listingId)
                .order('date', { ascending: true });

            if (error) {
                console.error('❌ Error loading availability:', error);
                return {};
            }

            console.log('📅 Raw availability data:', data);

            // Convert to the format expected by the calendar
            const availability = {};
            if (data && data.length > 0) {
                data.forEach(slot => {
                    const dateKey = this.formatDateKey(new Date(slot.date));
                    availability[dateKey] = slot.time_slots || [];
                });
            }

            console.log('📅 Formatted availability for listing:', listingId, availability);

            // Cache the result
            this.availabilityCache.set(listingId, availability);

            return availability;

        } catch (error) {
            console.error('❌ Exception loading availability:', error);
            return {};
        }
    }

    /**
     * Load availability for multiple listings
     * @param {Array} listingIds - Array of listing IDs
     * @returns {Object} Map of listing ID to availability data
     */
    async loadMultipleListingsAvailability(listingIds) {
        if (!listingIds || listingIds.length === 0) {
            return {};
        }

        try {
            console.log('📅 Loading availability for multiple listings:', listingIds);

            const { data, error } = await window.supabase
                .from('availability')
                .select('*')
                .in('listing_id', listingIds)
                .order('date', { ascending: true });

            if (error) {
                console.error('❌ Error loading multiple availability:', error);
                return {};
            }

            // Group by listing_id
            const listingAvailability = {};
            if (data && data.length > 0) {
                data.forEach(slot => {
                    const listingId = slot.listing_id;
                    const dateKey = this.formatDateKey(new Date(slot.date));
                    
                    if (!listingAvailability[listingId]) {
                        listingAvailability[listingId] = {};
                    }
                    
                    listingAvailability[listingId][dateKey] = slot.time_slots || [];
                });
            }

            // Cache all results
            Object.keys(listingAvailability).forEach(listingId => {
                this.availabilityCache.set(listingId, listingAvailability[listingId]);
            });

            return listingAvailability;

        } catch (error) {
            console.error('❌ Exception loading multiple availability:', error);
            return {};
        }
    }

    /**
     * Get cached availability for a listing
     * @param {string} listingId - The listing ID
     * @returns {Object} Cached availability data or empty object
     */
    getCachedAvailability(listingId) {
        return this.availabilityCache.get(listingId) || {};
    }

    /**
     * Clear cache for a specific listing
     * @param {string} listingId - The listing ID to clear from cache
     */
    clearListingCache(listingId) {
        this.availabilityCache.delete(listingId);
    }

    /**
     * Clear all cache
     */
    clearAllCache() {
        this.availabilityCache.clear();
    }

    /**
     * Format date for use as a key in availability object
     * @param {Date} date - The date to format
     * @returns {string} Formatted date key (YYYY-M-D)
     */
    formatDateKey(date) {
        if (!date || !(date instanceof Date)) {
            return '';
        }
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // JavaScript months are 0-indexed
        const day = date.getDate();
        
        return `${year}-${month}-${day}`;
    }

    /**
     * Check if a listing has availability on a specific date
     * @param {string} listingId - The listing ID
     * @param {Date} date - The date to check
     * @returns {boolean} True if has availability, false otherwise
     */
    hasAvailabilityOnDate(listingId, date) {
        const availability = this.getCachedAvailability(listingId);
        const dateKey = this.formatDateKey(date);
        return !!(availability[dateKey] && availability[dateKey].length > 0);
    }

    /**
     * Get available time slots for a specific date
     * @param {string} listingId - The listing ID
     * @param {Date} date - The date to get time slots for
     * @returns {Array} Array of available time slots
     */
    getTimeSlotsForDate(listingId, date) {
        const availability = this.getCachedAvailability(listingId);
        const dateKey = this.formatDateKey(date);
        return availability[dateKey] || [];
    }
}

// Initialize the global instance
window.listingsAvailabilityLoader = new ListingsAvailabilityLoader();

// Export for use in other scripts
window.loadListingAvailability = function(listingId) {
    return window.listingsAvailabilityLoader.loadListingAvailability(listingId);
};

window.hasListingAvailability = function(listingId, date) {
    return window.listingsAvailabilityLoader.hasAvailabilityOnDate(listingId, date);
};

window.getListingTimeSlots = function(listingId, date) {
    return window.listingsAvailabilityLoader.getTimeSlotsForDate(listingId, date);
};

console.log('✅ Listings Availability Loader ready'); 