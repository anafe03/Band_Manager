// js/schedule-manager-debug.js - Enhanced version with detailed logging
// Replace your schedule-manager.js temporarily with this debug version

class ScheduleManager {
    constructor() {
        this.supabaseUrl = 'https://gdmdurzaeezcrgrmtabx.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkbWR1cnphZWV6Y3Jncm10YWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1OTk3MDUsImV4cCI6MjA2MzE3NTcwNX0.xbuXRr2jDAAG021blK5zeuqwO-5zMNq7_tEfW_oW7cQ';
        this.currentUser = null;
        this.userListing = null;
        this.init();
    }

    async init() {
        console.log('🔧 Schedule Manager initializing...');
        
        // Wait for Supabase to be available
        await this.waitForSupabase();
        console.log('✅ Supabase available');
        
        // Check authentication status
        await this.checkAuthStatus();
        console.log('✅ Auth status checked, user:', this.currentUser ? 'Found' : 'Not found');
        
        // Set up event listeners
        this.setupEventListeners();
        console.log('✅ Event listeners set up');
        
        // Determine what to show
        await this.handleScheduleFlow();
        console.log('✅ Schedule flow handling complete');
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

    async checkAuthStatus() {
        console.log('🔍 Checking auth status...');
        
        try {
            // Use your existing global auth system
            if (window.auth && window.auth.getCurrentUser) {
                console.log('🔍 Using global auth system...');
                this.currentUser = await window.auth.getCurrentUser();
                console.log('👤 Global auth result:', this.currentUser ? {
                    id: this.currentUser.id,
                    email: this.currentUser.email
                } : 'No user');
            } else {
                console.log('🔍 Fallback to direct Supabase check...');
                // Fallback to direct Supabase check if global auth not ready
                const { data: { session }, error } = await window.supabase.auth.getSession();
                
                if (error) {
                    console.error('❌ Auth check error:', error);
                    return;
                }
                
                this.currentUser = session?.user || null;
                console.log('👤 Supabase auth result:', this.currentUser ? {
                    id: this.currentUser.id,
                    email: this.currentUser.email
                } : 'No user');
            }
        } catch (error) {
            console.error('❌ Auth status check failed:', error);
        }
    }

    async handleScheduleFlow() {
        console.log('🎯 Handling schedule flow...');
        console.log('👤 Current user state:', this.currentUser ? 'Authenticated' : 'Not authenticated');
        
        // If not authenticated, redirect to login
        if (!this.currentUser) {
            console.log('❌ No user found, redirecting to login');
            this.redirectToLogin();
            return;
        }

        console.log('✅ User authenticated, checking for listing...');
        // Check if user has a listing
        await this.checkUserListing();

        console.log('📋 Listing check result:', this.userListing ? 'Found listing' : 'No listing found');
        
        if (this.userListing) {
            console.log('✅ User has listing, showing schedule interface');
            console.log('📋 Listing details:', {
                id: this.userListing.id,
                title: this.userListing.title,
                address: this.userListing.address,
                price: this.userListing.price
            });
            await this.showScheduleInterface();
        } else {
            console.log('📝 No listing found, showing listing creation form');
            this.showListingCreationForm();
        }
    }

    async checkUserListing() {
        console.log('🔍 Checking for user listing...');
        
        if (!this.currentUser) {
            console.log('❌ No current user, cannot check listing');
            return;
        }

        console.log('🔍 Searching for listings with user_id:', this.currentUser.id);

        try {
            const { data, error } = await window.supabase
                .from('listings')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .eq('status', 'active');

            console.log('📡 Supabase response:', {
                data: data,
                error: error,
                dataLength: data ? data.length : 0
            });

            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                console.error('❌ Error checking listing:', error);
                return;
            }

            if (data && data.length > 0) {
                this.userListing = data[0]; // Take the first active listing
                console.log('✅ Found user listing:', {
                    id: this.userListing.id,
                    title: this.userListing.title,
                    created_at: this.userListing.created_at
                });
            } else {
                console.log('❌ No listings found for user');
                this.userListing = null;
            }

        } catch (error) {
            console.error('❌ Exception checking listing:', error);
        }
    }

    redirectToLogin() {
        console.log('🔄 Redirecting to login...');
        // Use your existing global auth system's redirect handling
        if (window.auth && window.auth.requireAuth) {
            window.auth.requireAuth('/pages/login.html');
        } else {
            // Fallback
            localStorage.setItem('auth_redirect_after_login', window.location.pathname);
            window.location.href = '/pages/login.html';
        }
    }

    async showScheduleInterface() {
        console.log('📅 Showing schedule interface...');
        
        // Hide listing creation form if visible
        this.hideListingCreationForm();
        
        // Update the property display with user's actual listing
        this.updatePropertyDisplay();
        
        // Show the calendar and booking interface
        this.showCalendarInterface();
        
        // Load availability for this listing
        await this.loadListingAvailability();
    }

    updatePropertyDisplay() {
        console.log('🏠 Updating property display...');
        
        if (!this.userListing) {
            console.log('❌ No listing to display');
            return;
        }

        console.log('🏠 Updating with listing data:', this.userListing);

        // Update property details
        const updates = {
            '.listing-title': this.userListing.title || 'Property Title',
            '.listing-address': this.userListing.address || 'Address',
            '.listing-price': `$${this.userListing.price?.toLocaleString() || '0'}`,
            '.listing-description': this.userListing.description || 'Description'
        };

        // Update bedroom/bathroom/sqft info in specs
        const specUpdates = [
            { selector: '.spec-value', index: 0, value: `${this.userListing.bedrooms || 0} Beds` },
            { selector: '.spec-value', index: 1, value: `${this.userListing.bathrooms || 0} Baths` },
            { selector: '.spec-value', index: 2, value: `${this.userListing.sqft?.toLocaleString() || 0} Sq.Ft.` }
        ];

        Object.entries(updates).forEach(([selector, value]) => {
            const elements = document.querySelectorAll(selector);
            console.log(`🔄 Updating ${selector} (${elements.length} elements) with: ${value}`);
            elements.forEach(el => {
                if (el) el.textContent = value;
            });
        });

        // Update spec values
        specUpdates.forEach(({ selector, index, value }) => {
            const elements = document.querySelectorAll(selector);
            if (elements[index]) {
                console.log(`🔄 Updating spec ${index} with: ${value}`);
                elements[index].textContent = value;
            }
        });

        // Update images if available
        if (this.userListing.images && this.userListing.images.length > 0) {
            console.log('🖼️ Updating property images...');
            this.updatePropertyImages();
        } else {
            console.log('📷 No custom images, keeping defaults');
        }

        // Update features if available
        if (this.userListing.features && this.userListing.features.length > 0) {
            console.log('🏷️ Updating property features...');
            this.updatePropertyFeatures();
        } else {
            console.log('🏷️ No custom features');
        }
    }

    updatePropertyImages() {
        const gallerySlides = document.querySelectorAll('.gallery-slide img');
        
        this.userListing.images.forEach((imageUrl, index) => {
            if (gallerySlides[index]) {
                console.log(`🖼️ Updating image ${index} with: ${imageUrl}`);
                gallerySlides[index].src = imageUrl;
                gallerySlides[index].alt = `${this.userListing.title} - Image ${index + 1}`;
            }
        });
    }

    updatePropertyFeatures() {
        const featuresContainer = document.querySelector('.listing-features');
        if (!featuresContainer) {
            console.log('❌ Features container not found');
            return;
        }

        console.log('🏷️ Adding features:', this.userListing.features);
        featuresContainer.innerHTML = this.userListing.features.map(feature => 
            `<span class="feature-tag">${feature}</span>`
        ).join('');
    }

    showListingCreationForm() {
        console.log('📝 Showing listing creation form...');
        
        // Hide the existing property display
        const propertySection = document.getElementById('property-listing');
        if (propertySection) {
            console.log('🙈 Hiding property section');
            propertySection.style.display = 'none';
        }

        // Hide calendar section until listing is created
        const calendarSection = document.getElementById('schedule-calendar');
        if (calendarSection) {
            console.log('🙈 Hiding calendar section');
            calendarSection.style.display = 'none';
        }

        // Show or create listing creation form
        this.createListingForm();
    }

    hideListingCreationForm() {
        console.log('🙈 Hiding listing creation form...');
        const formContainer = document.getElementById('listing-creation-container');
        if (formContainer) {
            formContainer.style.display = 'none';
        }
    }

    showCalendarInterface() {
        console.log('📅 Showing calendar interface...');
        
        const propertySection = document.getElementById('property-listing');
        const calendarSection = document.getElementById('schedule-calendar');
        
        if (propertySection) {
            console.log('👁️ Showing property section');
            propertySection.style.display = 'block';
        }
        
        if (calendarSection) {
            console.log('👁️ Showing calendar section');
            calendarSection.style.display = 'block';
        }
    }

    async loadListingAvailability() {
        console.log('📅 Loading listing availability...');
        
        if (!this.userListing) {
            console.log('❌ No listing to load availability for');
            return;
        }

        console.log('🔍 Loading availability for listing:', this.userListing.id);

        try {
            const { data, error } = await window.supabase
                .from('availability')
                .select('*')
                .eq('listing_id', this.userListing.id);

            console.log('📡 Availability response:', {
                data: data,
                error: error,
                dataLength: data ? data.length : 0
            });

            if (error) {
                console.error('❌ Error loading availability:', error);
                return;
            }

            // Convert to the format expected by the calendar
            const availabilityData = {};
            if (data && data.length > 0) {
                data.forEach(avail => {
                    const dateKey = this.formatDateKey(avail.date);
                    availabilityData[dateKey] = avail.time_slots;
                    console.log(`📅 Added availability for ${dateKey}:`, avail.time_slots);
                });
            } else {
                console.log('📅 No availability data found');
            }

            // Store in localStorage for calendar.js compatibility
            localStorage.setItem('savedAvailability', JSON.stringify(availabilityData));
            console.log('💾 Saved availability to localStorage:', availabilityData);

            // Trigger calendar refresh if calendar is loaded
            if (typeof renderCalendar === 'function') {
                console.log('🔄 Triggering calendar refresh');
                renderCalendar();
            }

        } catch (error) {
            console.error('❌ Exception loading availability:', error);
        }
    }

    formatDateKey(dateString) {
        const date = new Date(dateString);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        console.log(`📅 Formatted date ${dateString} to key: ${key}`);
        return key;
    }

    createListingForm() {
        console.log('📝 Creating listing form...');
        
        // Check if form already exists
        let formContainer = document.getElementById('listing-creation-container');
        
        if (!formContainer) {
            console.log('📝 Form container not found, creating new one');
            formContainer = document.createElement('div');
            formContainer.id = 'listing-creation-container';
            formContainer.innerHTML = this.getListingFormHTML();
            
            // Insert after the hero section
            const heroSection = document.querySelector('.hero-header');
            if (heroSection && heroSection.nextSibling) {
                heroSection.parentNode.insertBefore(formContainer, heroSection.nextSibling);
            } else {
                document.querySelector('main').prepend(formContainer);
            }
        } else {
            console.log('📝 Form container already exists');
        }

        formContainer.style.display = 'block';
        this.setupListingFormEvents();
        console.log('✅ Listing form created and shown');
    }

    getListingFormHTML() {
        return `
            <section class="listing-creation-section" style="padding: 60px 0; background: linear-gradient(135deg, #f8f9fa, #e9ecef);">
                <div class="container" style="max-width: 800px; margin: 0 auto; padding: 0 20px;">
                    <div class="section-header text-center" style="margin-bottom: 40px;">
                        <div class="line" style="height: 4px; width: 80px; background: linear-gradient(to right, #33443c, #5a7d6f); margin: 0 auto 15px; border-radius: 2px;"></div>
                        <h2 style="font-size: 32px; color: #33443c; margin: 0; font-weight: 600;">Create Your Property Listing</h2>
                        <p style="color: #666; margin-top: 10px;">Tell us about your property to start scheduling showings</p>
                    </div>

                    <form id="listing-creation-form" class="listing-form" style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                            <div class="form-group">
                                <label for="listing-title" style="display: block; margin-bottom: 8px; font-weight: 500; color: #33443c;">Property Title *</label>
                                <input type="text" id="listing-title" name="title" required 
                                       placeholder="e.g., Beautiful Family Home"
                                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;">
                            </div>
                            <div class="form-group">
                                <label for="listing-price" style="display: block; margin-bottom: 8px; font-weight: 500; color: #33443c;">Price *</label>
                                <input type="number" id="listing-price" name="price" required 
                                       placeholder="750000"
                                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;">
                            </div>
                        </div>

                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="listing-description" style="display: block; margin-bottom: 8px; font-weight: 500; color: #33443c;">Description *</label>
                            <textarea id="listing-description" name="description" required rows="4" 
                                      placeholder="Describe your property..."
                                      style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; resize: vertical; transition: border-color 0.3s;"></textarea>
                        </div>

                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="listing-address" style="display: block; margin-bottom: 8px; font-weight: 500; color: #33443c;">Address *</label>
                            <input type="text" id="listing-address" name="address" required 
                                   placeholder="123 Main Street"
                                   style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;">
                        </div>

                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                            <div class="form-group">
                                <label for="listing-city" style="display: block; margin-bottom: 8px; font-weight: 500; color: #33443c;">City *</label>
                                <input type="text" id="listing-city" name="city" required 
                                       placeholder="Anytown"
                                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;">
                            </div>
                            <div class="form-group">
                                <label for="listing-state" style="display: block; margin-bottom: 8px; font-weight: 500; color: #33443c;">State *</label>
                                <input type="text" id="listing-state" name="state" required 
                                       placeholder="CA"
                                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;">
                            </div>
                            <div class="form-group">
                                <label for="listing-zip" style="display: block; margin-bottom: 8px; font-weight: 500; color: #33443c;">ZIP Code *</label>
                                <input type="text" id="listing-zip" name="zip_code" required 
                                       placeholder="90210"
                                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;">
                            </div>
                        </div>

                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                            <div class="form-group">
                                <label for="listing-bedrooms" style="display: block; margin-bottom: 8px; font-weight: 500; color: #33443c;">Bedrooms *</label>
                                <input type="number" id="listing-bedrooms" name="bedrooms" required min="1" max="20" 
                                       placeholder="4"
                                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;">
                            </div>
                            <div class="form-group">
                                <label for="listing-bathrooms" style="display: block; margin-bottom: 8px; font-weight: 500; color: #33443c;">Bathrooms *</label>
                                <input type="number" id="listing-bathrooms" name="bathrooms" required min="1" max="20" step="0.5" 
                                       placeholder="3"
                                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;">
                            </div>
                            <div class="form-group">
                                <label for="listing-sqft" style="display: block; margin-bottom: 8px; font-weight: 500; color: #33443c;">Sq. Ft. *</label>
                                <input type="number" id="listing-sqft" name="sqft" required min="100" 
                                       placeholder="2400"
                                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;">
                            </div>
                            <div class="form-group">
                                <label for="listing-year-built" style="display: block; margin-bottom: 8px; font-weight: 500; color: #33443c;">Year Built</label>
                                <input type="number" id="listing-year-built" name="year_built" min="1800" max="2025" 
                                       placeholder="2015"
                                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;">
                            </div>
                        </div>

                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                            <div class="form-group">
                                <label for="listing-property-type" style="display: block; margin-bottom: 8px; font-weight: 500; color: #33443c;">Property Type *</label>
                                <select id="listing-property-type" name="property_type" required
                                        style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;">
                                    <option value="">Select Type</option>
                                    <option value="Single Family Home">Single Family Home</option>
                                    <option value="Condo">Condo</option>
                                    <option value="Townhouse">Townhouse</option>
                                    <option value="Multi-Family">Multi-Family</option>
                                    <option value="Land">Land</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="listing-lot-size" style="display: block; margin-bottom: 8px; font-weight: 500; color: #33443c;">Lot Size</label>
                                <input type="text" id="listing-lot-size" name="lot_size" 
                                       placeholder="0.25 acres"
                                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;">
                            </div>
                        </div>

                        <div class="form-group" style="margin-bottom: 30px;">
                            <label style="display: block; margin-bottom: 12px; font-weight: 500; color: #33443c;">Property Features</label>
                            <div class="features-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                                <label class="checkbox-label" style="display: flex; align-items: center; padding: 8px; cursor: pointer;">
                                    <input type="checkbox" name="features" value="Renovated" style="margin-right: 8px; transform: scale(1.2);">
                                    <span>Recently Renovated</span>
                                </label>
                                <label class="checkbox-label" style="display: flex; align-items: center; padding: 8px; cursor: pointer;">
                                    <input type="checkbox" name="features" value="Open Floor Plan" style="margin-right: 8px; transform: scale(1.2);">
                                    <span>Open Floor Plan</span>
                                </label>
                                <label class="checkbox-label" style="display: flex; align-items: center; padding: 8px; cursor: pointer;">
                                    <input type="checkbox" name="features" value="Garage" style="margin-right: 8px; transform: scale(1.2);">
                                    <span>Garage</span>
                                </label>
                                <label class="checkbox-label" style="display: flex; align-items: center; padding: 8px; cursor: pointer;">
                                    <input type="checkbox" name="features" value="Backyard" style="margin-right: 8px; transform: scale(1.2);">
                                    <span>Backyard</span>
                                </label>
                                <label class="checkbox-label" style="display: flex; align-items: center; padding: 8px; cursor: pointer;">
                                    <input type="checkbox" name="features" value="Central AC" style="margin-right: 8px; transform: scale(1.2);">
                                    <span>Central AC</span>
                                </label>
                                <label class="checkbox-label" style="display: flex; align-items: center; padding: 8px; cursor: pointer;">
                                    <input type="checkbox" name="features" value="Hardwood Floors" style="margin-right: 8px; transform: scale(1.2);">
                                    <span>Hardwood Floors</span>
                                </label>
                            </div>
                        </div>

                        <div class="form-actions" style="text-align: center; border-top: 1px solid #eee; padding-top: 30px;">
                            <button type="submit" id="create-listing-btn" 
                                    style="background: linear-gradient(135deg, #33443c, #5a7d6f); color: white; border: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(51, 68, 60, 0.3);">
                                Create Listing & Continue to Schedule
                            </button>
                            <div id="listing-status" style="margin-top: 15px; font-weight: 500;"></div>
                        </div>
                    </form>
                </div>
            </section>
        `;
    }

    setupListingFormEvents() {
        const form = document.getElementById('listing-creation-form');
        if (!form) {
            console.log('❌ Form not found for event setup');
            return;
        }

        console.log('🔧 Setting up form events...');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('📤 Form submitted');
            await this.handleListingCreation(e);
        });

        // Add input focus effects
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.style.borderColor = '#33443c';
                this.style.boxShadow = '0 0 0 3px rgba(51, 68, 60, 0.1)';
            });
            
            input.addEventListener('blur', function() {
                this.style.borderColor = '#e0e0e0';
                this.style.boxShadow = 'none';
            });
        });
        
        console.log('✅ Form events set up');
    }

    async handleListingCreation(e) {
        console.log('📝 Handling listing creation...');
        
        const formData = new FormData(e.target);
        const status = document.getElementById('listing-status');
        const submitBtn = document.getElementById('create-listing-btn');
        
        // Get selected features
        const features = [];
        const featureCheckboxes = document.querySelectorAll('input[name="features"]:checked');
        featureCheckboxes.forEach(checkbox => features.push(checkbox.value));

        const listingData = {
            user_id: this.currentUser.id,
            title: formData.get('title'),
            description: formData.get('description'),
            price: parseFloat(formData.get('price')),
            address: formData.get('address'),
            city: formData.get('city'),
            state: formData.get('state'),
            zip_code: formData.get('zip_code'),
            bedrooms: parseInt(formData.get('bedrooms')),
            bathrooms: parseFloat(formData.get('bathrooms')),
            sqft: parseInt(formData.get('sqft')),
            lot_size: formData.get('lot_size'),
            year_built: parseInt(formData.get('year_built')) || null,
            property_type: formData.get('property_type'),
            features: features,
            images: [], // Will be handled separately
            status: 'active',
            views: 0
        };

        console.log('📝 Listing data to create:', listingData);

        try {
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Listing...';
            status.innerHTML = '<span style="color: blue;">Creating your listing...</span>';

            const { data, error } = await window.supabase
                .from('listings')
                .insert([listingData])
                .select()
                .single();

            console.log('📡 Insert response:', { data, error });

            if (error) {
                throw error;
            }

            this.userListing = data;
            console.log('✅ Listing created successfully:', this.userListing);
            status.innerHTML = '<span style="color: green;">✅ Listing created successfully!</span>';

            // Hide the form and show the schedule interface
            setTimeout(async () => {
                this.hideListingCreationForm();
                await this.showScheduleInterface();
            }, 1500);

        } catch (error) {
            console.error('❌ Error creating listing:', error);
            status.innerHTML = `<span style="color: red;">❌ Error: ${error.message}</span>`;
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Listing & Continue to Schedule';
        }
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Listen for auth state changes from your global auth system
        window.addEventListener('authStateChanged', (event) => {
            console.log('🔄 Auth state changed event received:', event.detail);
            this.currentUser = window.authState?.user || event.detail?.authState?.user || null;
            
            if (this.currentUser) {
                this.handleScheduleFlow();
            } else {
                this.redirectToLogin();
            }
        });

        // Listen for booking submissions
        document.addEventListener('submit', async (e) => {
            if (e.target.classList.contains('booking-form')) {
                e.preventDefault();
                console.log('📅 Booking form submitted');
                await this.handleBookingSubmission(e);
            }
        });
        
        console.log('✅ Event listeners set up');
    }

    async handleBookingSubmission(e) {
        console.log('📅 Handling booking submission...');
        // Implementation for booking submission...
        // (keeping the rest of your existing code)
    }

    // Additional utility methods...
    getSelectedDate() {
        const selectedDay = document.querySelector('.calendar-day.selected');
        if (selectedDay && selectedDay.dataset.date) {
            return new Date(selectedDay.dataset.date);
        }
        return null;
    }
}

// Initialize the debug schedule manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the schedule page
    if (window.location.pathname.includes('schedule.html')) {
        console.log('🚀 Initializing DEBUG Schedule Manager');
        window.scheduleManager = new ScheduleManager();
    }
});

// Export for use in other scripts
window.ScheduleManager = ScheduleManager;