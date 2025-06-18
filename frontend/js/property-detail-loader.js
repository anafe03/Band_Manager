// js/property-detail-loader.js
// Main property detail loader for loading and displaying property information

class PropertyDetailLoader {
    constructor() {
        this.supabaseUrl = window.SUPABASE_CONFIG.url;
        this.supabaseKey = window.SUPABASE_CONFIG.key;
        this.propertyId = this.getPropertyIdFromUrl();
        this.currentImageIndex = 0;
        this.images = [];
        this.init();
    }

    getPropertyIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async init() {
        console.log('🏠 Loading property detail for ID:', this.propertyId);
        
        if (!this.propertyId) {
            this.showError('No property ID provided');
            return;
        }

        try {
            await this.loadPropertyData();
        } catch (error) {
            console.error('❌ Error loading property:', error);
            this.showError('Failed to load property details');
        }
    }

    async loadPropertyData() {
        const endpoint = `${this.supabaseUrl}/rest/v1/listings?select=*&id=eq.${this.propertyId}`;
        
        const response = await fetch(endpoint, {
            headers: {
                apikey: this.supabaseKey,
                Authorization: `Bearer ${this.supabaseKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        
        if (data.length === 0) {
            this.showError('Property not found');
            return;
        }

        const property = data[0];
        console.log('✅ Property loaded:', property);
        this.renderPropertyDetails(property);
    }

    renderPropertyDetails(property) {
        // Hide loading state
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('property-content').style.display = 'block';

        // Update title and meta
        document.title = `${property.title || 'Property'} | SelfNVest`;
        
        // Populate basic info
        document.getElementById('property-title').textContent = property.title || 'Property Listing';
        document.getElementById('property-address').innerHTML = `
            <i class="fas fa-map-marker-alt"></i>
            <span>${this.formatAddress(property)}</span>
        `;
        document.getElementById('property-price').textContent = this.formatPrice(property.price);
        
        // Update specs
        document.getElementById('bedrooms-spec').textContent = `${property.bedrooms || 0} Bedrooms`;
        document.getElementById('bathrooms-spec').textContent = `${property.bathrooms || 0} Bathrooms`;
        document.getElementById('sqft-spec').textContent = `${(property.sqft || 0).toLocaleString()} sq ft`;
        
        // Update description
        document.getElementById('property-description').textContent = property.description || 'No description available.';
        
        // Setup gallery
        this.setupGallery(property.images);
        
        // Setup features
        this.setupFeatures(property.features);
        
        // Setup property info
        this.setupPropertyInfo(property);
    }

    setupGallery(images) {
        // Handle different image formats
        let imageList = [];
        
        if (typeof images === 'string') {
            try {
                imageList = JSON.parse(images);
            } catch {
                if (images.startsWith('http')) {
                    imageList = [images];
                }
            }
        } else if (Array.isArray(images)) {
            imageList = images;
        }
        
        // Default images if none provided
        if (imageList.length === 0) {
            imageList = [
                'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                'https://images.unsplash.com/photo-1600210492493-0946911123ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                'https://images.unsplash.com/photo-1598228723793-52759bba239c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
            ];
        }
        
        this.images = imageList;
        
        // Set main image
        document.getElementById('main-image').src = imageList[0];
        
        // Setup thumbnails
        const thumbnailsContainer = document.getElementById('gallery-thumbnails');
        thumbnailsContainer.innerHTML = imageList.map((img, index) => `
            <img src="${img}" alt="Property Image ${index + 1}" class="thumbnail ${index === 0 ? 'active' : ''}" 
                 onclick="propertyLoader.changeMainImage(${index})">
        `).join('');
    }

    changeMainImage(index) {
        if (index >= 0 && index < this.images.length) {
            this.currentImageIndex = index;
            document.getElementById('main-image').src = this.images[index];
            
            // Update thumbnail active state
            document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
                thumb.classList.toggle('active', i === index);
            });
        }
    }

    setupFeatures(features) {
        let featuresList = [];
        
        if (typeof features === 'string') {
            try {
                featuresList = JSON.parse(features);
            } catch {
                featuresList = features.split(',').map(f => f.trim());
            }
        } else if (Array.isArray(features)) {
            featuresList = features;
        }
        
        // Default features if none provided
        if (featuresList.length === 0) {
            featuresList = ['Modern Kitchen', 'Hardwood Floors', 'Central Air', 'Garage', 'Backyard'];
        }
        
        const featuresGrid = document.getElementById('features-grid');
        featuresGrid.innerHTML = featuresList.map(feature => `
            <div class="feature-item">
                <i class="fas fa-check feature-icon"></i>
                <span>${feature}</span>
            </div>
        `).join('');
    }

    setupPropertyInfo(property) {
        const infoCards = [
            { label: 'Property Type', value: property.property_type || 'Residential' },
            { label: 'Year Built', value: property.year_built || 'N/A' },
            { label: 'Lot Size', value: property.lot_size ? `${property.lot_size} acres` : 'N/A' },
            { label: 'Status', value: property.status || 'Active' },
            { label: 'Views', value: (property.views || 0).toLocaleString() },
            { label: 'Listed', value: new Date(property.created_at).toLocaleDateString() }
        ];
        
        const infoGrid = document.getElementById('property-info-grid');
        infoGrid.innerHTML = infoCards.map(card => `
            <div class="info-card">
                <div class="info-label">${card.label}</div>
                <div class="info-value">${card.value}</div>
            </div>
        `).join('');
    }

    formatPrice(price) {
        if (!price) return 'Price on request';
        
        if (typeof price === 'string') {
            const numPrice = parseInt(price.replace(/\D/g, ''), 10);
            if (!isNaN(numPrice)) {
                return `$${numPrice.toLocaleString()}`;
            }
            return price;
        }
        
        if (typeof price === 'number') {
            return `$${price.toLocaleString()}`;
        }
        
        return 'Price on request';
    }

    formatAddress(property) {
        const parts = [];
        if (property.address) parts.push(property.address);
        if (property.city) parts.push(property.city);
        if (property.state) parts.push(property.state);
        if (property.zip_code) parts.push(property.zip_code);
        
        return parts.length > 0 ? parts.join(', ') : 'Address not specified';
    }

    showError(message) {
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('error-state').style.display = 'block';
        document.getElementById('error-state').querySelector('p').textContent = message;
    }
}

// Global property loader instance
let propertyLoader;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    propertyLoader = new PropertyDetailLoader();
});

// Export for global access
window.propertyLoader = propertyLoader;