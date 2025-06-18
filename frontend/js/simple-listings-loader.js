// js/simple-listings-loader.js
// Database-driven listings loader with detail page links

class SimpleListingsLoader {
    constructor() {
      // Get config from window object
      if (!window.SUPABASE_CONFIG) {
        console.error('❌ SUPABASE_CONFIG not found. Make sure the config script loads first.');
        this.showError('Configuration not loaded');
        return;
      }
      
      this.supabaseUrl = window.SUPABASE_CONFIG.url;
      this.supabaseKey = window.SUPABASE_CONFIG.key;
      
      this.listings = [];
      this.allListings = [];
      this.isLoading = false;
      this.init();
    }
  
    async init() {
      console.log('🏠 Initializing listings loader...');
      
      // Validate configuration
      if (!this.supabaseUrl || !this.supabaseKey) {
        console.error('❌ Missing Supabase configuration');
        this.showError('Supabase configuration incomplete');
        return;
      }
      
      if (this.supabaseKey === 'YOUR_ACTUAL_API_KEY_HERE') {
        console.error('❌ Please update the API key in the configuration script');
        this.showError('API key not configured. Please update the configuration script with your real Supabase API key.');
        return;
      }
      
      console.log('✅ Configuration loaded:', {
        url: this.supabaseUrl,
        keyPrefix: this.supabaseKey.substring(0, 20) + '...'
      });
      
      this.showLoadingStates();
      try {
        await this.loadListings();
        this.renderFeaturedListings();
        this.renderAllListings();
        this.setupFilters();
      } catch (error) {
        console.error('❌ Failed to initialize listings:', error);
        this.showError('Failed to load listings from database');
      }
    }
  
    showLoadingStates() {
      // Loading state for featured section
      const featuredContainer = document.getElementById('featured-scrolling-container');
      if (featuredContainer) {
        featuredContainer.innerHTML = `
          <div class="featured-loading" style="text-align: center; padding: 60px; color: #666;">
            <div style="display: inline-block; width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #33443c; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 15px;"></div>
            <p>Loading featured properties from database...</p>
          </div>
        `;
      }

      // Loading state for all listings section
      const grid = document.querySelector('.listings-grid');
      if (grid) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: white; border-radius: 8px;">
            <div class="loading-spinner" style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #33443c; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
            <h3 style="color: #33443c; margin-bottom: 10px;">Loading All Properties...</h3>
            <p style="color: #666;">Fetching listings from database...</p>
          </div>
        `;
      }
      
      // Add loading animation styles if not already present
      if (!document.getElementById('loading-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
          @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
          }
        `;
        document.head.appendChild(style);
      }
    }
  
    async loadListings() {
      if (this.isLoading) {
        console.log('⏳ Already loading listings...');
        return;
      }
      
      this.isLoading = true;
      console.log('🔄 Loading listings from Supabase database...');
      
      const endpoint = `${this.supabaseUrl}/rest/v1/listings?select=id,title,description,price,address,city,state,zip_code,bedrooms,bathrooms,sqft,lot_size,year_built,property_type,features,images,status,views,created_at,updated_at&order=created_at.desc`;
      
      try {
        console.log('📡 Making request to:', endpoint);
        console.log('🔑 Using API key prefix:', this.supabaseKey.substring(0, 20) + '...');
        
        const res = await fetch(endpoint, {
          method: 'GET',
          headers: {
            apikey: this.supabaseKey,
            Authorization: `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        });
        
        console.log('📊 Response status:', res.status);
        console.log('📊 Response headers:', Object.fromEntries(res.headers.entries()));
        
        if (!res.ok) {
          const text = await res.text();
          console.error('❌ API Error Response:', text);
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        
        const data = await res.json();
        console.log('📊 Raw database response:', data);
        
        if (Array.isArray(data)) {
          this.allListings = [...data];
          this.listings = [...data];
          console.log(`✅ Successfully loaded ${data.length} listings from database`);
        } else {
          console.warn('⚠️ Unexpected data format from database:', data);
          this.allListings = [];
          this.listings = [];
        }
      } catch (err) {
        console.error('💥 Error loading listings from database:', err);
        this.allListings = [];
        this.listings = [];
        throw err;
      } finally {
        this.isLoading = false;
      }
    }

    renderFeaturedListings() {
      const featuredContainer = document.getElementById('featured-scrolling-container');
      if (!featuredContainer) {
        console.warn('⚠️ Featured listings container not found');
        return;
      }

      if (this.allListings.length === 0) {
        console.log('📭 No listings in database - showing empty featured state');
        featuredContainer.innerHTML = `
          <div style="text-align: center; padding: 60px; color: #666;">
            <i class="fas fa-home" style="font-size: 48px; color: #ddd; margin-bottom: 16px;"></i>
            <h3 style="margin-bottom: 8px; color: #999;">No Featured Properties</h3>
            <p>Featured listings will appear here when properties are added to the database.</p>
          </div>
        `;
        return;
      }

      // Take first 8 listings for featured section (or duplicate if fewer)
      let featuredListings = [...this.allListings];
      if (featuredListings.length < 8) {
        // Duplicate listings to have enough for scrolling effect
        while (featuredListings.length < 8) {
          featuredListings = [...featuredListings, ...this.allListings];
        }
      }
      featuredListings = featuredListings.slice(0, 8);

      console.log(`🌟 Rendering ${featuredListings.length} featured properties from database`);

      // Create scrolling rows (split into 2 rows of 4)
      const row1 = featuredListings.slice(0, 4);
      const row2 = featuredListings.slice(4, 8);

      featuredContainer.innerHTML = `
        <!-- First row - moves left -->
        <div class="scrolling-row">
          ${row1.map(listing => this.createScrollingCard(listing)).join('')}
          ${row1.map(listing => this.createScrollingCard(listing)).join('')} <!-- Duplicate for infinite scroll -->
        </div>
        
        <!-- Second row - moves right -->
        <div class="scrolling-row">
          ${row2.map(listing => this.createScrollingCard(listing)).join('')}
          ${row2.map(listing => this.createScrollingCard(listing)).join('')} <!-- Duplicate for infinite scroll -->
        </div>
      `;
    }

    createScrollingCard(listing) {
      const title = listing.title || 'Property Listing';
      const price = this.formatPrice(listing.price);
      const address = this.formatAddress(listing);
      const bedrooms = listing.bedrooms || listing.beds || 0;
      const bathrooms = listing.bathrooms || listing.baths || 0;
      const sqft = listing.sqft || listing.square_feet || 0;
      const images = this.getPropertyImages(listing.images);

      return `
        <div class="scrolling-card" onclick="window.listingsLoader.viewListingDetails('${listing.id}')">
          <div class="scrolling-image-container">
            <img src="${images.main}" alt="${title}" class="scrolling-image" 
                 onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'">
          </div>
          <div class="scrolling-details">
            <h3 class="scrolling-title">${title}</h3>
            <div class="scrolling-price">${price}</div>
            <div class="scrolling-address">${address}</div>
            <div class="scrolling-specs">
              ${bedrooms > 0 ? `<span>${bedrooms} Beds</span>` : ''}
              ${bedrooms > 0 && bathrooms > 0 ? ' • ' : ''}
              ${bathrooms > 0 ? `<span>${bathrooms} Baths</span>` : ''}
              ${(bedrooms > 0 || bathrooms > 0) && sqft > 0 ? ' • ' : ''}
              ${sqft > 0 ? `<span>${sqft.toLocaleString()} sq ft</span>` : ''}
            </div>
            <button class="cta-button green-button">View Details</button>
          </div>
        </div>
      `;
    }
  
    renderAllListings() {
      const grid = document.querySelector('.listings-grid');
      if (!grid) {
        console.warn('⚠️ Listings grid not found in DOM');
        return;
      }
      
      // If no listings from database, show empty state
      if (this.listings.length === 0) {
        console.log('📭 No listings found in database - showing empty state');
        this.showEmptyState();
        return;
      }
  
      // Configure grid layout
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
      grid.style.gap = '24px';
      grid.style.padding = '0';
      grid.style.border = 'none';
      
      // Generate listing cards
      console.log(`🏗️ Rendering ${this.listings.length} property cards from database`);
      grid.innerHTML = this.listings.map(listing => this.createListingCard(listing)).join('');
      
      // Add interactive effects
      this.addHoverEffects();
    }
  
    createListingCard(listing) {
      // Handle missing or null values gracefully
      const title = listing.title || 'Property Listing';
      const price = this.formatPrice(listing.price);
      const address = this.formatAddress(listing);
      const bedrooms = listing.bedrooms || listing.beds || 0;
      const bathrooms = listing.bathrooms || listing.baths || 0;
      const sqft = listing.sqft || listing.square_feet || 0;
      const images = this.getPropertyImages(listing.images);
      const description = listing.description || 'No description available';
      
      return `
        <div class="listing-card" style="
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
        " onclick="window.listingsLoader.viewListingDetails('${listing.id}')">
          <div class="listing-image-container" style="
            position: relative;
            height: 240px;
            overflow: hidden;
            background: #f5f5f5;
          ">
            <img 
              src="${images.main}" 
              alt="${title}"
              style="
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.3s ease;
              "
              onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'"
            >
            <div class="listing-overlay" style="
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 100%);
              opacity: 0;
              transition: opacity 0.3s ease;
            "></div>
            <div class="listing-price-badge" style="
              position: absolute;
              top: 16px;
              right: 16px;
              background: #33443c;
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 16px;
            ">
              ${price}
            </div>
          </div>
          
          <div class="listing-details" style="padding: 20px;">
            <h3 style="
              margin: 0 0 8px 0;
              font-size: 20px;
              font-weight: 600;
              color: #333;
              line-height: 1.3;
            ">${title}</h3>
            
            <div class="listing-address" style="
              color: #666;
              margin-bottom: 16px;
              font-size: 14px;
              display: flex;
              align-items: center;
            ">
              <i class="fas fa-map-marker-alt" style="margin-right: 6px; color: #33443c;"></i>
              ${address}
            </div>
            
            <div class="listing-specs" style="
              display: flex;
              gap: 16px;
              margin-bottom: 16px;
              font-size: 14px;
              color: #555;
            ">
              ${bedrooms > 0 ? `<span><i class="fas fa-bed" style="margin-right: 4px;"></i> ${bedrooms} Beds</span>` : ''}
              ${bathrooms > 0 ? `<span><i class="fas fa-bath" style="margin-right: 4px;"></i> ${bathrooms} Baths</span>` : ''}
              ${sqft > 0 ? `<span><i class="fas fa-ruler-combined" style="margin-right: 4px;"></i> ${sqft.toLocaleString()} sq ft</span>` : ''}
            </div>
            
            <p style="
              color: #666;
              font-size: 14px;
              line-height: 1.5;
              margin-bottom: 20px;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            ">${description}</p>
            
            <div style="display: flex; gap: 8px;">
              <button 
                class="view-details-btn"
                style="
                  flex: 1;
                  background: #33443c;
                  color: white;
                  border: none;
                  padding: 12px 16px;
                  border-radius: 6px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: all 0.2s ease;
                  font-size: 14px;
                "
              >
                <i class="fas fa-info-circle" style="margin-right: 6px;"></i>
                Details
              </button>
              <button 
                class="schedule-viewing-btn"
                onclick="event.stopPropagation(); window.listingsLoader.showBookingCalendar('${listing.id}', '${title.replace(/'/g, "\\'")}', '${address.replace(/'/g, "\\'")}')"
                style="
                  flex: 1;
                  background: #5a7d6f;
                  color: white;
                  border: none;
                  padding: 12px 16px;
                  border-radius: 6px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: all 0.2s ease;
                  font-size: 14px;
                "
              >
                <i class="fas fa-calendar-alt" style="margin-right: 6px;"></i>
                Schedule
              </button>
            </div>
          </div>
        </div>
      `;
    }
    
    formatPrice(price) {
      if (!price) return 'Price on request';
      
      // Handle string prices (e.g., "$500,000")
      if (typeof price === 'string') {
        const numPrice = parseInt(price.replace(/\D/g, ''), 10);
        if (!isNaN(numPrice)) {
          return `${numPrice.toLocaleString()}`;
        }
        return price;
      }
      
      // Handle numeric prices
      if (typeof price === 'number') {
        return `${price.toLocaleString()}`;
      }
      
      return 'Price on request';
    }
    
    formatAddress(listing) {
      const parts = [];
      if (listing.address) parts.push(listing.address);
      if (listing.city) parts.push(listing.city);
      if (listing.state) parts.push(listing.state);
      if (listing.zip_code) parts.push(listing.zip_code);
      
      return parts.length > 0 ? parts.join(', ') : 'Address not specified';
    }
    
    getPropertyImages(images) {
      // Default fallback image
      const defaultImage = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
      
      if (!images) return { main: defaultImage };
      
      // Handle different image formats
      if (typeof images === 'string') {
        try {
          const parsed = JSON.parse(images);
          return { main: parsed[0] || defaultImage };
        } catch {
          return { main: images.startsWith('http') ? images : defaultImage };
        }
      }
      
      if (Array.isArray(images)) {
        return { main: images[0] || defaultImage };
      }
      
      return { main: defaultImage };
    }
  
    showEmptyState() {
      const grid = document.querySelector('.listings-grid');
      if (!grid) return;
      
      grid.style.display = 'flex';
      grid.style.justifyContent = 'center';
      grid.style.alignItems = 'center';
      grid.style.minHeight = '200px';
      grid.style.border = '2px dashed #ddd';
      grid.style.borderRadius = '8px';
      grid.style.padding = '40px';
      
      grid.innerHTML = `
        <div style="text-align: center; color: #666;">
          <i class="fas fa-home" style="font-size: 48px; color: #ddd; margin-bottom: 16px;"></i>
          <h3 style="margin-bottom: 8px; color: #999;">No Properties Available</h3>
          <p style="margin-bottom: 20px;">The database is currently empty. Listings will appear here once they're added.</p>
          <button 
            onclick="window.listingsLoader.init()" 
            style="
              background: #33443c; 
              color: white; 
              border: none; 
              padding: 10px 20px; 
              border-radius: 4px; 
              cursor: pointer;
              font-weight: 500;
            "
          >
            Refresh
          </button>
        </div>
      `;
    }
  
    addHoverEffects() {
      // Remove existing styles to prevent duplicates
      const existing = document.getElementById('listing-hover-styles');
      if (existing) existing.remove();
      
      const style = document.createElement('style');
      style.id = 'listing-hover-styles';
      style.textContent = `
        .listing-card {
          transition: all 0.3s ease !important;
        }
        .listing-card:hover {
          transform: translateY(-8px) !important;
          box-shadow: 0 12px 28px rgba(0,0,0,0.15) !important;
        }
        .listing-card:hover .listing-overlay {
          opacity: 1 !important;
        }
        .listing-card:hover img {
          transform: scale(1.05) !important;
        }
        .view-details-btn:hover {
          background: #5a7d6f !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
        }
        .scrolling-card {
          transition: all 0.3s ease !important;
        }
        .scrolling-card:hover {
          transform: translateY(-5px) !important;
          box-shadow: 0 8px 20px rgba(0,0,0,0.15) !important;
        }
      `;
      document.head.appendChild(style);
    }
  
    setupFilters() {
      console.log('🔧 Setting up filter event listeners...');
      
      const filterIds = ['property-type', 'price-range', 'bedrooms', 'bathrooms'];
      filterIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.addEventListener('change', () => this.applyFilters());
          console.log(`✅ Filter listener added for: ${id}`);
        } else {
          console.warn(`⚠️ Filter element not found: ${id}`);
        }
      });
      
      const filterButton = document.querySelector('.filter-button');
      if (filterButton) {
        filterButton.addEventListener('click', () => this.applyFilters());
        console.log('✅ Filter button listener added');
      }
      
      console.log('🎛️ All filters ready');
    }
  
    applyFilters() {
      console.log('🔍 Applying filters to listings...');
      
      const propertyType = document.getElementById('property-type')?.value || 'all';
      const priceRange = document.getElementById('price-range')?.value || 'all';
      const bedrooms = document.getElementById('bedrooms')?.value || 'all';
      const bathrooms = document.getElementById('bathrooms')?.value || 'all';
      
      console.log('Filter values:', { propertyType, priceRange, bedrooms, bathrooms });
  
      let filtered = [...this.allListings];
  
      // Property type filter
      if (propertyType !== 'all') {
        filtered = filtered.filter(listing => {
          const type = (listing.property_type || listing.type || '').toLowerCase();
          return type === propertyType.toLowerCase();
        });
      }
  
      // Price range filter
      if (priceRange !== 'all') {
        const [minRaw, maxRaw] = priceRange.split('-');
        const min = parseInt(minRaw.replace(/\D/g, ''), 10);
        const max = maxRaw && maxRaw !== '+' ? parseInt(maxRaw.replace(/\D/g, ''), 10) : null;
        
        filtered = filtered.filter(listing => {
          if (!listing.price) return false;
          
          const price = typeof listing.price === 'string'
            ? parseInt(listing.price.replace(/\D/g, ''), 10)
            : listing.price;
            
          if (isNaN(price)) return false;
          
          return max ? (price >= min && price <= max) : (price >= min);
        });
      }
  
      // Bedrooms filter
      if (bedrooms !== 'all') {
        const minBedrooms = parseInt(bedrooms, 10);
        filtered = filtered.filter(listing => (listing.bedrooms || listing.beds || 0) >= minBedrooms);
      }
  
      // Bathrooms filter
      if (bathrooms !== 'all') {
        const minBathrooms = parseInt(bathrooms, 10);
        filtered = filtered.filter(listing => (listing.bathrooms || listing.baths || 0) >= minBathrooms);
      }
  
      console.log(`📊 Filtered from ${this.allListings.length} to ${filtered.length} listings`);
      
      this.listings = filtered;
      this.renderAllListings();
    }
  
    showError(message) {
      // Show error in featured section
      const featuredContainer = document.getElementById('featured-scrolling-container');
      if (featuredContainer) {
        featuredContainer.innerHTML = `
          <div style="text-align: center; padding: 60px; background: #fff5f5; border: 2px solid #fed7d7; border-radius: 8px; margin: 20px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 36px; color: #e53e3e; margin-bottom: 16px;"></i>
            <h3 style="color: #e53e3e; margin-bottom: 8px;">Unable to Load Featured Listings</h3>
            <p style="color: #666;">${message}</p>
          </div>
        `;
      }

      // Show error in all listings section
      const grid = document.querySelector('.listings-grid');
      if (grid) {
        grid.style.display = 'flex';
        grid.style.justifyContent = 'center';
        grid.style.alignItems = 'center';
        grid.innerHTML = `
          <div style="text-align: center; padding: 60px; background: #fff5f5; border: 2px solid #fed7d7; border-radius: 8px; max-width: 400px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #e53e3e; margin-bottom: 16px;"></i>
            <h3 style="color: #e53e3e; margin-bottom: 8px;">Unable to Load Listings</h3>
            <p style="color: #666; margin-bottom: 20px;">${message}</p>
            <button 
              onclick="location.reload()" 
              style="
                background: #e53e3e; 
                color: white; 
                border: none; 
                padding: 10px 20px; 
                border-radius: 4px; 
                cursor: pointer;
                font-weight: 500;
              "
            >
              Try Again
            </button>
          </div>
        `;
      }
    }
    
    // Method to handle viewing listing details - UPDATED TO NAVIGATE TO DETAIL PAGE
    viewListingDetails(listingId) {
      console.log(`🔍 Navigating to detail page for listing: ${listingId}`);
      // Navigate to the property detail page with the listing ID
      window.location.href = `../pages/property-detail.html?id=${listingId}`;
    }

    // Method to show booking calendar popup on listings page
    showBookingCalendar(listingId, propertyTitle, propertyAddress) {
      console.log(`📅 Showing booking calendar for listing: ${listingId}`);
      
      // Create booking popup if it doesn't exist
      if (!document.getElementById('booking-popup-overlay')) {
        this.createBookingPopup();
      }
      
      // Store the current listing data
      this.currentBookingListing = {
        id: listingId,
        title: propertyTitle,
        address: propertyAddress
      };
      
      // Update popup content with property info
      const selectedDateEl = document.getElementById('selected-date');
      if (selectedDateEl) {
        selectedDateEl.textContent = 'Select a date';
      }
      
      const popupTitle = document.querySelector('.booking-popup h3');
      if (popupTitle) {
        popupTitle.innerHTML = `Schedule Viewing for <br><strong style="color: #33443c;">${propertyTitle}</strong><br><small style="color: #666; font-weight: 400;">${propertyAddress}</small><br><span id="selected-date" style="color: #5a7d6f;">Select a date</span>`;
      }
      
      // Generate available time slots
      this.generateTimeSlots();
      
      // Show the popup
      const popup = document.getElementById('booking-popup-overlay');
      if (popup) {
        popup.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        // Add animation class after display
        setTimeout(() => {
          popup.classList.add('active');
        }, 10);
      }
    }

    // Create the booking popup HTML structure using calendar.css classes
    createBookingPopup() {
      const bookingPopupOverlay = document.createElement('div');
      bookingPopupOverlay.id = 'booking-popup-overlay';
      bookingPopupOverlay.className = 'booking-popup-overlay';
      
             bookingPopupOverlay.innerHTML = `
         <div class="booking-popup">
           <button class="popup-close" onclick="window.listingsLoader.closeBookingPopup()">&times;</button>
           <button class="back-to-listings-btn" onclick="window.listingsLoader.closeBookingPopup()" style="
             position: absolute;
             top: 20px;
             left: 20px;
             background: #33443c;
             color: white;
             border: none;
             padding: 8px 16px;
             border-radius: 20px;
             font-size: 14px;
             font-weight: 500;
             cursor: pointer;
             transition: all 0.3s ease;
             display: flex;
             align-items: center;
             gap: 6px;
           ">
             <i class="fas fa-arrow-left"></i>
             Back to Listings
           </button>
           <h3>Schedule Viewing for <span id="selected-date">Select a date</span></h3>
          
                     <!-- Mini Calendar for Date Selection -->
           <div class="mini-calendar" style="margin: 20px 0;">
             <div class="calendar-navigation" style="justify-content: center; margin-bottom: 15px;">
               <button type="button" class="nav-btn prev-btn" onclick="window.listingsLoader.navigateCalendar(-1)">&#10094;</button>
               <div class="current-period" id="current-period-popup" style="margin: 0 20px; font-weight: 600;"></div>
               <button type="button" class="nav-btn next-btn" onclick="window.listingsLoader.navigateCalendar(1)">&#10095;</button>
             </div>
             <div class="calendar-days">
               <div class="day-header">Sun</div>
               <div class="day-header">Mon</div>
               <div class="day-header">Tue</div>
               <div class="day-header">Wed</div>
               <div class="day-header">Thu</div>
               <div class="day-header">Fri</div>
               <div class="day-header">Sat</div>
             </div>
             <div class="calendar-grid" id="calendar-grid-popup" style="
               display: grid;
               grid-template-columns: repeat(7, 1fr);
               gap: 1px;
               background: #f5f5f5;
               border-radius: 8px;
               padding: 1px;
               overflow: hidden;
             ">
               <!-- Calendar days will be populated by JavaScript -->
             </div>
           </div>
          
          <div class="time-slots-container" id="time-slots-container">
            <!-- Time slots will be populated when a date is selected -->
          </div>
          
          <form class="booking-form" onsubmit="window.listingsLoader.submitBooking(event)">
            <div class="form-group">
              <label for="visitor-name">Full Name *</label>
              <input type="text" id="visitor-name" name="visitor-name" required placeholder="Enter your full name">
            </div>
            
            <div class="form-group">
              <label for="visitor-email">Email Address *</label>
              <input type="email" id="visitor-email" name="visitor-email" required placeholder="Enter your email">
            </div>
            
            <div class="form-group">
              <label for="visitor-phone">Phone Number *</label>
              <input type="tel" id="visitor-phone" name="visitor-phone" required placeholder="Enter your phone number">
            </div>
            
            <div class="form-group">
              <label for="special-requests">Special Requests (Optional)</label>
              <textarea id="special-requests" name="special-requests" rows="3" placeholder="Any special requests or questions about the property?"></textarea>
            </div>
            
            <button type="submit" class="book-now-btn">
              <i class="fas fa-calendar-check" style="margin-right: 8px;"></i>
              Confirm Booking
            </button>
          </form>
        </div>
      `;
      
             // Add popup to page
       document.body.appendChild(bookingPopupOverlay);
       
       // Add hover effect for back button
       const backBtn = bookingPopupOverlay.querySelector('.back-to-listings-btn');
       if (backBtn) {
         backBtn.addEventListener('mouseenter', function() {
           this.style.background = '#2a372f';
           this.style.transform = 'translateY(-1px)';
           this.style.boxShadow = '0 4px 12px rgba(51, 68, 60, 0.3)';
         });
         backBtn.addEventListener('mouseleave', function() {
           this.style.background = '#33443c';
           this.style.transform = 'translateY(0)';
           this.style.boxShadow = 'none';
         });
       }
       
       // Initialize calendar state
       this.currentDate = new Date();
       this.selectedDate = null;
       this.generateCalendar();
       
       // Add click outside to close
       bookingPopupOverlay.addEventListener('click', (event) => {
         if (event.target === bookingPopupOverlay) {
           this.closeBookingPopup();
         }
       });
    }

    // Generate mini calendar for the popup - SHOWS ONLY CURRENT MONTH
    generateCalendar() {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();
      
      // Update current period display
      const currentPeriodEl = document.getElementById('current-period-popup');
      if (currentPeriodEl) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
        currentPeriodEl.textContent = `${months[month]} ${year}`;
      }
      
      const calendarGrid = document.getElementById('calendar-grid-popup');
      if (!calendarGrid) return;
      
      calendarGrid.innerHTML = '';
      
      // Get first day of month and number of days
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const today = new Date();
      
      // Add empty cells for days before month starts (but keep them invisible)
      for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day';
        emptyDay.style.visibility = 'hidden'; // Hide instead of showing other month days
        calendarGrid.appendChild(emptyDay);
      }
      
      // Add days of current month ONLY
      for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const currentDate = new Date(year, month, day);
        const isPast = currentDate < today.setHours(0, 0, 0, 0);
        const isToday = currentDate.toDateString() === today.toDateString();
        
        // Style past dates as disabled
        if (isPast) {
          dayElement.classList.add('other-month');
          dayElement.style.cursor = 'not-allowed';
          dayElement.style.opacity = '0.4';
        } else {
          dayElement.addEventListener('click', () => this.selectDate(currentDate));
          dayElement.style.cursor = 'pointer';
        }
        
        // Highlight today
        if (isToday && !isPast) {
          dayElement.classList.add('today');
        }
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
        
        calendarGrid.appendChild(dayElement);
      }
      
      // Calculate remaining cells needed to complete the grid (max 6 rows * 7 days = 42 cells)
      const totalCellsUsed = firstDay + daysInMonth;
      const totalRows = Math.ceil(totalCellsUsed / 7);
      const totalCells = totalRows * 7;
      const remainingCells = totalCells - totalCellsUsed;
      
      // Add invisible cells to complete the grid layout
      for (let i = 0; i < remainingCells; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day';
        emptyDay.style.visibility = 'hidden';
        calendarGrid.appendChild(emptyDay);
      }
    }

    // Navigate calendar months
    navigateCalendar(direction) {
      this.currentDate.setMonth(this.currentDate.getMonth() + direction);
      this.generateCalendar();
    }

    // Select a date on the calendar
    selectDate(date) {
      this.selectedDate = date;
      
      // Update selected date display
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const selectedDateEl = document.getElementById('selected-date');
      if (selectedDateEl) {
        selectedDateEl.textContent = formattedDate;
      }
      
      // Update calendar visual state
      document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('selected');
      });
      event.currentTarget.classList.add('selected');
      
      // Show time slots
      this.generateTimeSlots();
    }

    // Generate available time slots
    generateTimeSlots() {
      const timeSlots = [
        '9:00 AM', '10:00 AM', '11:00 AM',
        '1:00 PM', '2:00 PM', '3:00 PM',
        '4:00 PM', '5:00 PM', '6:00 PM'
      ];
      
      const container = document.getElementById('time-slots-container');
      if (container) {
        container.innerHTML = timeSlots.map(time => `
          <div class="time-slot-option" onclick="window.listingsLoader.selectTimeSlot(this)" data-time="${time}">
            ${time}
          </div>
        `).join('');
      }
    }

    // Select a time slot
    selectTimeSlot(element) {
      document.querySelectorAll('.time-slot-option').forEach(slot => {
        slot.classList.remove('selected');
      });
      element.classList.add('selected');
    }

    // Close booking popup
    closeBookingPopup() {
      const popup = document.getElementById('booking-popup-overlay');
      if (popup) {
        popup.classList.remove('active');
        setTimeout(() => {
          popup.style.display = 'none';
          document.body.style.overflow = 'auto';
        }, 300);
      }
    }

    // Submit booking form
    submitBooking(event) {
      event.preventDefault();
      
      const selectedTimeSlot = document.querySelector('.time-slot-option.selected');
      if (!selectedTimeSlot) {
        alert('Please select a time slot.');
        return;
      }
      
      if (!this.selectedDate) {
        alert('Please select a date.');
        return;
      }
      
      const formData = new FormData(event.target);
      const bookingData = {
        listingId: this.currentBookingListing.id,
        propertyTitle: this.currentBookingListing.title,
        propertyAddress: this.currentBookingListing.address,
        date: this.selectedDate,
        time: selectedTimeSlot.dataset.time,
        visitorName: formData.get('visitor-name'),
        visitorEmail: formData.get('visitor-email'),
        visitorPhone: formData.get('visitor-phone'),
        specialRequests: formData.get('special-requests')
      };
      
      console.log('📅 Booking submitted:', bookingData);
      
      // Here you would typically send this data to your backend/Supabase
      // For now, we'll show a success message
      alert(`✅ Booking Request Submitted!\n\nProperty: ${bookingData.propertyTitle}\nDate: ${bookingData.date.toLocaleDateString()}\nTime: ${bookingData.time}\n\nWe will contact you shortly to confirm your viewing.`);
      
      this.closeBookingPopup();
      
      // Reset form
      event.target.reset();
    }
  }
  
  // Initialize when DOM is ready
  window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, checking for listings containers...');
    
    const hasListingsGrid = document.querySelector('.listings-grid');
    const hasFeaturedContainer = document.getElementById('featured-scrolling-container');
    
    if (hasListingsGrid || hasFeaturedContainer) {
      console.log('📋 Listings containers found, initializing database loader...');
      window.listingsLoader = new SimpleListingsLoader();
    } else {
      console.log('❌ No listings containers found on this page');
    }
  });
  
  // Expose class globally for debugging
  window.SimpleListingsLoader = SimpleListingsLoader;