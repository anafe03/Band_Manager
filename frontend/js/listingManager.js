// Listing Manager Module



class ListingManager {
    constructor() {
      this.userListing = null;
      this.supabaseUrl = 'https://gdmdurzaeezcrgrmtabx.supabase.co'; // Replace with your Supabase URL
      this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkbWR1cnphZWV6Y3Jncm10YWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1OTk3MDUsImV4cCI6MjA2MzE3NTcwNX0.xbuXRr2jDAAG021blK5zeuqwO-5zMNq7_tEfW_oW7cQ'; // Replace with your Supabase anon key
      this.userId = this.getCurrentUserId(); // Get current user ID
      this.init();
    }
  
    init() {
      this.setupEventListeners();
      this.checkExistingListing();
    }
  
    getCurrentUserId() {
      // For now, generate a consistent user ID based on session
      // In production, you'd get this from your auth system
      let userId = localStorage.getItem('user_id');
      if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('user_id', userId);
      }
      return userId;
    }
  
    async checkExistingListing() {
      try {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/listings?user_id=eq.${this.userId}`, {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
  
        if (response.ok) {
          const listings = await response.json();
          if (listings.length > 0) {
            this.userListing = listings[0];
            this.updateMenuToViewListing();
          }
        }
      } catch (error) {
        console.log('No existing listing found or error checking:', error);
      }
    }
  
    setupEventListeners() {
      // Listing creation form submission
      const createListingForm = document.getElementById('create-listing-form');
      if (createListingForm) {
        createListingForm.addEventListener('submit', (e) => this.handleCreateListing(e));
      }
  
      // Image upload handler
      const imageUpload = document.getElementById('listing-images');
      if (imageUpload) {
        imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
      }
  
      // Close buttons
      const closeCreateListing = document.getElementById('close-create-listing');
      if (closeCreateListing) {
        closeCreateListing.addEventListener('click', () => this.closeCreateListingPopout());
      }
  
      const closeViewListing = document.getElementById('close-view-listing');
      if (closeViewListing) {
        closeViewListing.addEventListener('click', () => this.closeViewListingPopout());
      }
  
      // Overlay clicks
      const listingOverlay = document.getElementById('listing-overlay');
      if (listingOverlay) {
        listingOverlay.addEventListener('click', () => this.closeAllListingPopouts());
      }
  
      // Edit listing button
      document.addEventListener('click', (e) => {
        if (e.target.id === 'edit-listing-btn') {
          this.showEditListingForm();
        }
      });
    }
  
    showCreateListingPopout() {
      const createListingPopout = document.getElementById('create-listing-popout');
      const listingOverlay = document.getElementById('listing-overlay');
  
      if (createListingPopout && listingOverlay) {
        createListingPopout.classList.add('active');
        listingOverlay.classList.add('active');
      }
    }
  
    showViewListingPopout() {
      const viewListingPopout = document.getElementById('view-listing-popout');
      const listingOverlay = document.getElementById('listing-overlay');
  
      if (viewListingPopout && listingOverlay) {
        this.populateViewListing();
        viewListingPopout.classList.add('active');
        listingOverlay.classList.add('active');
      }
    }
  
    closeCreateListingPopout() {
      const createListingPopout = document.getElementById('create-listing-popout');
      const listingOverlay = document.getElementById('listing-overlay');
  
      if (createListingPopout && listingOverlay) {
        createListingPopout.classList.remove('active');
        listingOverlay.classList.remove('active');
      }
    }
  
    closeViewListingPopout() {
      const viewListingPopout = document.getElementById('view-listing-popout');
      const listingOverlay = document.getElementById('listing-overlay');
  
      if (viewListingPopout && listingOverlay) {
        viewListingPopout.classList.remove('active');
        listingOverlay.classList.remove('active');
      }
    }
  
    closeAllListingPopouts() {
      this.closeCreateListingPopout();
      this.closeViewListingPopout();
    }
  
    async handleCreateListing(e) {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      const listingData = {
        user_id: this.userId,
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
        year_built: parseInt(formData.get('year_built')),
        property_type: formData.get('property_type'),
        features: this.getSelectedFeatures(),
        images: this.getUploadedImages(),
        status: 'active',
        views: 0
      };
  
      try {
        this.showLoadingState();
        
        const response = await fetch(`${this.supabaseUrl}/rest/v1/listings`, {
          method: 'POST',
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(listingData)
        });
  
        if (response.ok) {
          const newListing = await response.json();
          this.userListing = Array.isArray(newListing) ? newListing[0] : newListing;
          this.updateMenuToViewListing();
          this.closeCreateListingPopout();
          this.showSuccessMessage('Listing created successfully!');
        } else {
          throw new Error('Failed to create listing');
        }
      } catch (error) {
        console.error('Error creating listing:', error);
        this.showErrorMessage('Failed to create listing. Please try again.');
      } finally {
        this.hideLoadingState();
      }
    }
  
    getSelectedFeatures() {
      const features = [];
      const checkboxes = document.querySelectorAll('input[name="features"]:checked');
      checkboxes.forEach(checkbox => {
        features.push(checkbox.value);
      });
      return features;
    }
  
    getUploadedImages() {
      // For now, return placeholder images
      // In production, you'd upload to Supabase storage and return URLs
      return [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'
      ];
    }
  
    handleImageUpload(e) {
      const files = e.target.files;
      const preview = document.getElementById('image-preview');
      
      if (preview) {
        preview.innerHTML = '';
        
        Array.from(files).forEach(file => {
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = document.createElement('img');
              img.src = e.target.result;
              img.style.width = '100px';
              img.style.height = '100px';
              img.style.objectFit = 'cover';
              img.style.borderRadius = '8px';
              img.style.margin = '5px';
              preview.appendChild(img);
            };
            reader.readAsDataURL(file);
          }
        });
      }
    }
  
    updateMenuToViewListing() {
      const menuText = document.getElementById('listing-menu-text');
      if (menuText) {
        menuText.textContent = 'Your Listing';
      }
    }
  
    populateViewListing() {
      if (!this.userListing) return;
  
      const elements = {
        'view-listing-title': this.userListing.title,
        'view-listing-price': `$${this.userListing.price?.toLocaleString()}`,
        'view-listing-address': this.userListing.address,
        'view-listing-city': `${this.userListing.city}, ${this.userListing.state} ${this.userListing.zip_code}`,
        'view-listing-description': this.userListing.description,
        'view-listing-bedrooms': this.userListing.bedrooms,
        'view-listing-bathrooms': this.userListing.bathrooms,
        'view-listing-sqft': this.userListing.sqft?.toLocaleString(),
        'view-listing-year': this.userListing.year_built,
        'view-listing-type': this.userListing.property_type,
        'view-listing-views': this.userListing.views || 0
      };
  
      Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
          element.textContent = value;
        }
      });
  
      // Populate features
      const featuresContainer = document.getElementById('view-listing-features');
      if (featuresContainer && this.userListing.features) {
        featuresContainer.innerHTML = this.userListing.features.map(feature => 
          `<span class="feature-tag">${feature}</span>`
        ).join('');
      }
  
      // Populate images
      const imagesContainer = document.getElementById('view-listing-images');
      if (imagesContainer && this.userListing.images) {
        imagesContainer.innerHTML = this.userListing.images.map(image => 
          `<img src="${image}" alt="Property Image" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">`
        ).join('');
      }
    }
  
    showEditListingForm() {
      // Pre-populate the create form with existing data for editing
      if (this.userListing) {
        const form = document.getElementById('create-listing-form');
        if (form) {
          // Populate form fields
          const fields = ['title', 'description', 'price', 'address', 'city', 'state', 'zip_code', 
                         'bedrooms', 'bathrooms', 'sqft', 'lot_size', 'year_built', 'property_type'];
          
          fields.forEach(field => {
            const input = form.querySelector(`[name="${field}"]`);
            if (input && this.userListing[field]) {
              input.value = this.userListing[field];
            }
          });
  
          // Change form title and button text
          const formTitle = document.getElementById('create-listing-title');
          const submitBtn = document.getElementById('create-listing-submit');
          
          if (formTitle) formTitle.textContent = 'Edit Your Listing';
          if (submitBtn) submitBtn.textContent = 'Update Listing';
          
          // Show the form
          this.closeViewListingPopout();
          this.showCreateListingPopout();
        }
      }
    }
  
    showLoadingState() {
      const submitBtn = document.getElementById('create-listing-submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
      }
    }
  
    hideLoadingState() {
      const submitBtn = document.getElementById('create-listing-submit');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Listing';
      }
    }
  
    showSuccessMessage(message) {
      this.showMessage(message, 'success');
    }
  
    showErrorMessage(message) {
      this.showMessage(message, 'error');
    }
  
    showMessage(message, type) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `listing-message ${type}`;
      messageDiv.textContent = message;
      messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        ${type === 'success' ? 'background: #28a745;' : 'background: #dc3545;'}
      `;
      
      document.body.appendChild(messageDiv);
      
      setTimeout(() => {
        messageDiv.remove();
      }, 5000);
    }
  }
  
  // Global functions for compatibility
  function showCreateListing() {
    if (listingManager) {
      if (listingManager.userListing) {
        listingManager.showViewListingPopout();
      } else {
        listingManager.showCreateListingPopout();
      }
    }
  }
  
  // Initialize listing manager
  let listingManager;
  document.addEventListener('DOMContentLoaded', () => {
    listingManager = new ListingManager();
  });