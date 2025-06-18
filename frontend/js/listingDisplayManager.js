// js/listingsDisplayManager.js - Manages displaying listings on the listings page

class ListingsDisplayManager {
    constructor() {
        this.currentListings = [];
        this.filters = {
            property_type: 'all',
            price_range: 'all',
            bedrooms: 'all',
            bathrooms: 'all'
        };
        this.init();
    }

    async init() {
        console.log('🏠 Listings Display Manager initializing...');
        
        // Wait for other managers to be ready
        if (typeof window.listingManager === 'undefined') {
            setTimeout(() => this.init(), 100);
            return;
        }

        await this.loadListings();
        this.setupFilters();
        this.setupSearch();
        
        console.log('✅ Listings Display Manager ready');
    }

    async loadListings() {
        try {
            console.log('📋 Loading all listings...');
            
            // Get all active listings
            this.currentListings = await window.listingManager.getAllListings(this.filters);
            
            console.log(`Found ${this.currentListings.length} listings`);
            
            // Render listings
            this.renderListings();
            
        } catch (error) {
            console.error('❌ Error loading listings:', error);
            this.showError('Failed to load listings. Please try again.');
        }
    }

    renderListings() {
        const listingsGrid = document.querySelector('.listings-grid');
        
        if (!listingsGrid) {
            console.warn('Listings grid not found on this page');
            return;
        }

        if (this.currentListings.length === 0) {
            listingsGrid.innerHTML = `
                <div class="empty-listings">
                    <i class="fas fa-home" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
                    <h3>No listings found</h3>
                    <p>No properties match your current filters.</p>
                    <button class="cta-button" onclick="this.clearFilters()">Clear Filters</button>
                </div>
            `;
            return;
        }

        // Generate HTML for each listing
        const listingsHTML = this.currentListings.map(listing => this.createListingCard(listing)).join('');
        
        listingsGrid.innerHTML = listingsHTML;
    }

    createListingCard(listing) {
        const formatted = window.listingManager.formatListingForDisplay(listing);
        const primaryImage = listing.images && listing.images.length > 0 
            ? listing.images[0] 
            : 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';

        return `
            <div class="listing-card" data-listing-id="${listing.id}">
                <div class="listing-image-container">
                    <img src="${primaryImage}" alt="${formatted.title}" class="listing-image">
                    <div class="listing-overlay">
                        <button class="view-details-btn" onclick="listingsDisplayManager.viewListing('${listing.id}')">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                    </div>
                </div>
                <div class="listing-content">
                    <h3 class="listing-title">${formatted.title}</h3>
                    <p class="listing-address">${formatted.address}</p>
                    <div class="listing-price">${formatted.price}</div>
                    <div class="listing-specs">
                        ${formatted.bedrooms ? `<span>${formatted.bedrooms} beds</span>` : ''}
                        ${formatted.bathrooms ? `<span>${formatted.bathrooms} baths</span>` : ''}
                        ${formatted.sqft ? `<span>${formatted.sqft} sq ft</span>` : ''}
                    </div>
                    <div class="listing-features">
                        ${formatted.features.slice(0, 3).map(feature => 
                            `<span class="feature-tag">${feature}</span>`
                        ).join('')}
                    </div>
                    <div class="listing-actions">
                        <button class="btn-schedule" onclick="listingsDisplayManager.scheduleShowing('${listing.id}')">
                            <i class="fas fa-calendar"></i> Schedule Showing
                        </button>
                        <button class="btn-favorite" onclick="listingsDisplayManager.toggleFavorite('${listing.id}')">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async viewListing(listingId) {
        try {
            // Increment view count
            await window.listingManager.incrementViews(listingId);
            
            // Redirect to individual listing page
            window.location.href = `/pages/listing/${listingId}/schedule.html`;
        } catch (error) {
            console.error('Error viewing listing:', error);
            // Fallback - just navigate anyway
            window.location.href = `/pages/listing/${listingId}/schedule.html`;
        }
    }

    scheduleShowing(listingId) {
        // Redirect to schedule page for this specific listing
        window.location.href = `/pages/listing/${listingId}/schedule.html`;
    }

    toggleFavorite(listingId) {
        // Toggle favorite status (implement later)
        const favoriteBtn = document.querySelector(`[data-listing-id="${listingId}"] .btn-favorite i`);
        if (favoriteBtn.classList.contains('far')) {
            favoriteBtn.classList.remove('far');
            favoriteBtn.classList.add('fas');
            favoriteBtn.style.color = '#e74c3c';
        } else {
            favoriteBtn.classList.remove('fas');
            favoriteBtn.classList.add('far');
            favoriteBtn.style.color = '';
        }
    }

    setupFilters() {
        // Property type filter
        const propertyTypeFilter = document.getElementById('property-type');
        if (propertyTypeFilter) {
            propertyTypeFilter.addEventListener('change', () => {
                this.filters.property_type = propertyTypeFilter.value;
                this.applyFilters();
            });
        }

        // Price range filter
        const priceRangeFilter = document.getElementById('price-range');
        if (priceRangeFilter) {
            priceRangeFilter.addEventListener('change', () => {
                this.filters.price_range = priceRangeFilter.value;
                this.applyFilters();
            });
        }

        // Bedrooms filter
        const bedroomsFilter = document.getElementById('bedrooms');
        if (bedroomsFilter) {
            bedroomsFilter.addEventListener('change', () => {
                this.filters.bedrooms = bedroomsFilter.value;
                this.applyFilters();
            });
        }

        // Bathrooms filter
        const bathroomsFilter = document.getElementById('bathrooms');
        if (bathroomsFilter) {
            bathroomsFilter.addEventListener('change', () => {
                this.filters.bathrooms = bathroomsFilter.value;
                this.applyFilters();
            });
        }

        // Filter button
        const filterButton = document.querySelector('.filter-button');
        if (filterButton) {
            filterButton.addEventListener('click', () => {
                this.applyFilters();
            });
        }
    }

    setupSearch() {
        // Search functionality (if you add a search box later)
        const searchInput = document.getElementById('listings-search');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => {
                this.searchListings(searchInput.value);
            }, 300));
        }
    }

    async applyFilters() {
        try {
            console.log('🔍 Applying filters:', this.filters);
            
            // Convert filter values to API format
            const apiFilters = this.convertFiltersForAPI(this.filters);
            
            // Get filtered listings
            this.currentListings = await window.listingManager.getAllListings(apiFilters);
            
            // Re-render
            this.renderListings();
            
        } catch (error) {
            console.error('❌ Error applying filters:', error);
            this.showError('Failed to apply filters. Please try again.');
        }
    }

    convertFiltersForAPI(filters) {
        const apiFilters = {};

        // Property type
        if (filters.property_type && filters.property_type !== 'all') {
            apiFilters.property_type = filters.property_type;
        }

        // Price range
        if (filters.price_range && filters.price_range !== 'all') {
            const priceRange = filters.price_range.split('-');
            if (priceRange[0] !== '0') {
                apiFilters.min_price = parseInt(priceRange[0]);
            }
            if (priceRange[1] && priceRange[1] !== '+') {
                apiFilters.max_price = parseInt(priceRange[1]);
            }
        }

        // Bedrooms
        if (filters.bedrooms && filters.bedrooms !== 'all') {
            apiFilters.min_bedrooms = parseInt(filters.bedrooms);
        }

        // Bathrooms
        if (filters.bathrooms && filters.bathrooms !== 'all') {
            apiFilters.min_bathrooms = parseInt(filters.bathrooms);
        }

        return apiFilters;
    }

    async searchListings(searchTerm) {
        try {
            if (!searchTerm.trim()) {
                // If search is empty, reload all listings
                await this.loadListings();
                return;
            }

            console.log('🔍 Searching for:', searchTerm);
            
            const apiFilters = this.convertFiltersForAPI(this.filters);
            this.currentListings = await window.listingManager.searchListings(searchTerm, apiFilters);
            
            this.renderListings();
            
        } catch (error) {
            console.error('❌ Error searching listings:', error);
            this.showError('Search failed. Please try again.');
        }
    }

    clearFilters() {
        // Reset all filters
        this.filters = {
            property_type: 'all',
            price_range: 'all',
            bedrooms: 'all',
            bathrooms: 'all'
        };

        // Reset filter UI
        const filterElements = document.querySelectorAll('.filter-select');
        filterElements.forEach(element => {
            element.value = 'all';
        });

        // Reload listings
        this.loadListings();
    }

    showError(message) {
        const listingsGrid = document.querySelector('.listings-grid');
        if (listingsGrid) {
            listingsGrid.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button class="cta-button" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }

    // Refresh listings (call this when new listings are added)
    async refresh() {
        await this.loadListings();
    }
}

// Utility function for debouncing search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize on listings page
    if (document.querySelector('.listings-grid') || window.location.pathname.includes('listings')) {
        window.listingsDisplayManager = new ListingsDisplayManager();
    }
});

// Export for other scripts
window.ListingsDisplayManager = ListingsDisplayManager;