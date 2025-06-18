// Property Manager Module
class PropertyManager {
    constructor() {
      this.properties = [];
      this.currentPropertyIndex = 0;
      this.init();
    }
  
    init() {
      this.setupEventListeners();
      this.loadStaticProperties();
    }
  
    setupEventListeners() {
      // Property popout close buttons
      const closePropertyPopout = document.getElementById('close-property-popout');
      if (closePropertyPopout) {
        closePropertyPopout.addEventListener('click', () => this.closePropertyPopout());
      }
  
      const propertyOverlay = document.getElementById('property-overlay');
      if (propertyOverlay) {
        propertyOverlay.addEventListener('click', () => this.closePropertyPopout());
      }
  
      // Property split-screen close
      const propertySplitClose = document.getElementById('property-split-close');
      if (propertySplitClose) {
        propertySplitClose.addEventListener('click', () => this.closePropertySplitScreen());
      }
  
      // Property split-screen chat
      this.setupPropertyChat();
  
      // Image slider controls
      this.setupImageSlider();
    }
  
    loadStaticProperties() {
      this.properties = [
        {
          id: 'prop1',
          address: '123 Main Street, Boston, MA 02108',
          price: '$749,000',
          bedrooms: 3,
          bathrooms: 2,
          sqft: 1850,
          type: 'Single Family',
          year_built: 2010,
          status: 'For Sale',
          description: 'Beautiful single-family home in the heart of Boston. This property features an open floor plan, hardwood floors throughout, and a recently renovated kitchen with stainless steel appliances.',
          images: [
            'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
            'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'
          ],
          features: [
            'Central Air Conditioning',
            'Attached Garage (2 cars)',
            'Finished Basement',
            'Fireplace',
            'Walk-in Closets'
          ],
          neighborhood: 'Located in a quiet, family-friendly neighborhood with excellent schools nearby.'
        },
        {
          id: 'prop2',
          address: '456 Park Avenue, Cambridge, MA 02139',
          price: '$899,000',
          bedrooms: 4,
          bathrooms: 3,
          sqft: 2200,
          type: 'Townhouse',
          year_built: 2015,
          status: 'For Sale',
          description: 'Modern townhouse in Cambridge with contemporary design and high-end finishes.',
          images: [
            'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
            'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'
          ],
          features: [
            'Smart Home Technology',
            'Energy Efficient Appliances',
            'Hardwood Floors',
            'Rooftop Terrace'
          ],
          neighborhood: 'Prime Cambridge location near Harvard and MIT.'
        },
        {
          id: 'prop3',
          address: '789 Ocean Drive, Revere, MA 02151',
          price: '$1,250,000',
          bedrooms: 5,
          bathrooms: 4,
          sqft: 3500,
          type: 'Luxury Home',
          year_built: 2020,
          status: 'For Sale',
          description: 'Stunning luxury waterfront property with panoramic ocean views.',
          images: [
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'
          ],
          features: [
            'Waterfront Property',
            'Home Theater',
            'Wine Cellar',
            'Infinity Pool'
          ],
          neighborhood: 'Exclusive beachfront community with private beach access.'
        }
      ];
  
      this.displayProperties();
    }
  
    displayProperties() {
      const propertyList = document.getElementById('property-list');
      if (!propertyList) return;
  
      const propertiesHTML = this.properties.map(prop => {
        return `
          <div class="property-item" onclick="propertyManager.openPropertySplitView('${prop.id}')">
            <div class="property-icon">
              <i class="fas fa-home"></i>
            </div>
            <div class="property-info">
              <h4>${prop.address}</h4>
              <p>${prop.price} • ${prop.bedrooms} bed, ${prop.bathrooms} bath • ${prop.sqft} sqft</p>
            </div>
          </div>
        `;
      }).join('');
  
      propertyList.innerHTML = propertiesHTML;
    }
  
    openPropertySplitView(propertyId) {
      const property = this.properties.find(p => p.id === propertyId);
      if (!property) {
        console.error('Property not found');
        return;
      }
  
      const propertySplitScreen = document.getElementById('property-split-screen');
      const propertyImages = document.getElementById('property-images');
      const propertyContent = document.getElementById('property-content');
      const propertySplitMessages = document.getElementById('property-split-messages');
  
      if (!propertySplitScreen || !propertyImages || !propertyContent || !propertySplitMessages) {
        console.error('Property split-screen elements not found');
        return;
      }
  
      // Set up images
      const imagesHTML = property.images.map(img => {
        return `<div class="property-image" style="background-image: url('${img}'); height: 350px; min-width: 100%; background-size: cover; background-position: center center;"></div>`;
      }).join('');
      propertyImages.innerHTML = imagesHTML;
  
      // Set up property content
      propertyContent.innerHTML = `
        <div class="property-header">
          <h2 class="property-title">${property.type}</h2>
          <p class="property-address">${property.address}</p>
          <p class="property-price">${property.price}</p>
        </div>
        
        <div class="property-features">
          <div class="property-feature">
            <i class="fas fa-bed"></i> ${property.bedrooms} Bedrooms
          </div>
          <div class="property-feature">
            <i class="fas fa-bath"></i> ${property.bathrooms} Bathrooms
          </div>
          <div class="property-feature">
            <i class="fas fa-ruler-combined"></i> ${property.sqft} sqft
          </div>
          <div class="property-feature">
            <i class="fas fa-calendar-alt"></i> Built ${property.year_built}
          </div>
        </div>
        
        <div class="property-description">
          <p>${property.description}</p>
        </div>
        
        <div class="property-section">
          <h3>Features</h3>
          <div class="property-section-content">
            <ul>
              ${property.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
          </div>
        </div>
        
        <div class="property-section">
          <h3>Neighborhood</h3>
          <div class="property-section-content">
            <p>${property.neighborhood}</p>
          </div>
        </div>
      `;
  
      // Initialize chat
      propertySplitMessages.innerHTML = `
        <div class="message ai">
          <div class="message-content">
            <p>I'm here to help you with this property at ${property.address}. What would you like to know or modify about this listing?</p>
          </div>
        </div>
      `;
  
      // Show split screen
      propertySplitScreen.classList.add('active');
      this.closePropertyPopout();
  
      // Initialize image slider
      this.initPropertyImageSlider();
    }
  
    setupPropertyChat() {
      const propertySplitSendButton = document.getElementById('property-split-send-button');
      const propertySplitChatInput = document.getElementById('property-split-chat-input');
  
      if (propertySplitSendButton && propertySplitChatInput) {
        propertySplitSendButton.addEventListener('click', () => {
          this.sendPropertyChatMessage();
        });
  
        propertySplitChatInput.addEventListener('keypress', (event) => {
          if (event.key === 'Enter') {
            this.sendPropertyChatMessage();
          }
        });
      }
    }
  
    sendPropertyChatMessage() {
      const chatInput = document.getElementById('property-split-chat-input');
      const chatMessages = document.getElementById('property-split-messages');
  
      if (!chatInput || !chatMessages) return;
  
      const message = chatInput.value.trim();
      if (message === '') return;
  
      // Add user message
      chatMessages.innerHTML += `
        <div class="message user">
          <div class="message-content">
            <p>${message}</p>
          </div>
        </div>
      `;
  
      chatInput.value = '';
      chatMessages.scrollTop = chatMessages.scrollHeight;
  
      // Generate AI response
      setTimeout(() => {
        let aiResponse = '';
        
        if (message.toLowerCase().includes('price') || message.toLowerCase().includes('cost')) {
          aiResponse = 'The price is negotiable within a reasonable range. Would you like me to schedule a viewing or provide more information about financing options?';
        } else if (message.toLowerCase().includes('feature') || message.toLowerCase().includes('amenities')) {
          aiResponse = 'I can add additional features to this listing. What specific features would you like to add?';
        } else if (message.toLowerCase().includes('schedule') || message.toLowerCase().includes('viewing')) {
          aiResponse = 'I can help you schedule a viewing. What date and time works best for you?';
        } else {
          aiResponse = 'I\'m here to help with any questions about this property. You can ask about features, neighborhood, pricing, or request to add or remove information from the listing.';
        }
  
        chatMessages.innerHTML += `
          <div class="message ai">
            <div class="message-content">
              <p>${aiResponse}</p>
            </div>
          </div>
        `;
  
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 1000);
    }
  
    setupImageSlider() {
      document.addEventListener('click', (e) => {
        if (e.target.id === 'slider-prev') {
          this.previousImage();
        } else if (e.target.id === 'slider-next') {
          this.nextImage();
        }
      });
    }
  
    initPropertyImageSlider() {
      const propertyImages = document.getElementById('property-images');
      const slides = propertyImages?.querySelectorAll('.property-image');
      
      if (slides && slides.length > 0) {
        this.currentPropertyIndex = 0;
        this.updateImageSlider();
      }
    }
  
    previousImage() {
      const propertyImages = document.getElementById('property-images');
      const slides = propertyImages?.querySelectorAll('.property-image');
      
      if (slides && this.currentPropertyIndex > 0) {
        this.currentPropertyIndex--;
        this.updateImageSlider();
      }
    }
  
    nextImage() {
      const propertyImages = document.getElementById('property-images');
      const slides = propertyImages?.querySelectorAll('.property-image');
      
      if (slides && this.currentPropertyIndex < slides.length - 1) {
        this.currentPropertyIndex++;
        this.updateImageSlider();
      }
    }
  
    updateImageSlider() {
      const propertyImages = document.getElementById('property-images');
      if (propertyImages) {
        propertyImages.style.transform = `translateX(-${this.currentPropertyIndex * 100}%)`;
      }
    }
  
    closePropertyPopout() {
      const propertyPopout = document.getElementById('property-popout');
      const propertyOverlay = document.getElementById('property-overlay');
  
      if (propertyPopout && propertyOverlay) {
        propertyPopout.classList.remove('active');
        propertyOverlay.classList.remove('active');
      }
    }
  
    closePropertySplitScreen() {
      const propertySplitScreen = document.getElementById('property-split-screen');
      if (propertySplitScreen) {
        propertySplitScreen.classList.remove('active');
      }
    }
  }
  
  // Global functions for compatibility
  function showPropertyPopout(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const propertyPopout = document.getElementById('property-popout');
    const propertyOverlay = document.getElementById('property-overlay');
    
    if (propertyPopout && propertyOverlay) {
      propertyPopout.classList.add('active');
      propertyOverlay.classList.add('active');
    }
  }
  
  // Initialize property manager
  let propertyManager;
  document.addEventListener('DOMContentLoaded', () => {
    propertyManager = new PropertyManager();
  });