document.addEventListener('DOMContentLoaded', function() {
  // Check if map element exists before initializing
  if (!document.getElementById('map')) {
    console.log('Map element not found on this page');
    return;
  }

  // Initialize map centered on Austin, TX area
  const map = L.map('map').setView([30.2672, -97.7431], 11);

  // Load map tiles (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Property listings matching the scrolling gallery data
  const listings = [
    {
      id: 1,
      title: "Modern Family Home",
      lat: 30.3005,
      lng: -97.8040,
      price: "$489,500",
      image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=500&q=80",
      link: "#",
      type: "residential",
      specs: "4 beds • 2.5 baths • 2,240 sqft",
      address: "123 Maple Avenue, Westlake Hills"
    },
    {
      id: 2,
      title: "Luxury Villa",
      lat: 30.2540,
      lng: -97.8230,
      price: "$725,000",
      image: "https://images.unsplash.com/photo-1605146769289-440113cc3d00?auto=format&fit=crop&w=500&q=80",
      link: "#",
      type: "residential",
      specs: "5 beds • 3 baths • 3,200 sqft",
      address: "456 Oak Drive, Cedar Park"
    },
    {
      id: 3,
      title: "Contemporary House",
      lat: 30.5089,
      lng: -97.6786,
      price: "$395,000",
      image: "https://images.unsplash.com/photo-1564078516393-cf04bd966897?auto=format&fit=crop&w=500&q=80",
      link: "#",
      type: "residential",
      specs: "3 beds • 2 baths • 1,850 sqft",
      address: "789 Pine Street, Round Rock"
    },
    {
      id: 4,
      title: "Cozy Townhouse",
      lat: 30.4394,
      lng: -97.6203,
      price: "$285,000",
      image: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=500&q=80",
      link: "#",
      type: "residential",
      specs: "2 beds • 1.5 baths • 1,200 sqft",
      address: "321 Elm Court, Pflugerville"
    },
    {
      id: 5,
      title: "Executive Home",
      lat: 30.6327,
      lng: -97.6779,
      price: "$625,000",
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=500&q=80",
      link: "#",
      type: "residential",
      specs: "4 beds • 3 baths • 2,800 sqft",
      address: "654 Birch Lane, Georgetown"
    },
    {
      id: 6,
      title: "Suburban Beauty",
      lat: 30.5783,
      lng: -97.8514,
      price: "$445,000",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=80",
      link: "#",
      type: "residential",
      specs: "3 beds • 2.5 baths • 2,100 sqft",
      address: "987 Willow Way, Leander"
    },
    {
      id: 7,
      title: "Charming Cottage",
      lat: 30.5427,
      lng: -97.5461,
      price: "$315,000",
      image: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=500&q=80",
      link: "#",
      type: "residential",
      specs: "2 beds • 2 baths • 1,400 sqft",
      address: "159 Rose Avenue, Hutto"
    },
    {
      id: 8,
      title: "Modern Condo",
      lat: 30.2672,
      lng: -97.7431,
      price: "$195,000",
      image: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=500&q=80",
      link: "#",
      type: "condo",
      specs: "1 bed • 1 bath • 800 sqft",
      address: "753 Urban Plaza, Downtown Austin"
    }
  ];

  // Create markers for each listing
  const markers = {};
  listings.forEach(listing => {
    const marker = L.marker([listing.lat, listing.lng]).addTo(map);
    marker.bindPopup(`
      <div class="map-popup">
        <strong>${listing.title}</strong><br>
        <div class="map-popup-price">${listing.price}</div>
        <div class="map-popup-address">${listing.address}</div>
        <div class="map-popup-specs">${listing.specs}</div>
        <img src="${listing.image}" width="150" style="border-radius: 8px; margin: 8px 0;"><br>
        <a href="${listing.link}" class="map-popup-link">View Details</a>
      </div>
    `);
    
    // Store markers by type for filtering
    if (!markers[listing.type]) {
      markers[listing.type] = [];
    }
    markers[listing.type].push(marker);
  });

  // Add filter functionality
  const filterButtons = document.querySelectorAll('.map-filter-button');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const filterType = this.getAttribute('data-filter');
      
      // Toggle active class
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Show/hide markers based on filter
      if (filterType === 'all') {
        // Show all markers
        Object.values(markers).flat().forEach(marker => {
          marker.addTo(map);
        });
      } else {
        // Remove all markers first
        Object.values(markers).flat().forEach(marker => {
          map.removeLayer(marker);
        });
        
        // Add only the filtered markers
        if (markers[filterType]) {
          markers[filterType].forEach(marker => {
            marker.addTo(map);
          });
        }
      }
    });
  });

  // Simulate fetching data from an API (for demonstration purposes)
  // In a real application, this would be replaced with an actual API call
  /*
  fetch('/api/listings')
    .then(res => res.json())
    .then(apiListings => {
      apiListings.forEach(listing => {
        const marker = L.marker([listing.lat, listing.lng]).addTo(map);
        marker.bindPopup(`
          <strong>${listing.title}</strong><br>
          ${listing.price}<br>
          <img src="${listing.image}" width="120"><br>
          <a href="${listing.link}">View Listing</a>
        `);
      });
    })
    .catch(error => console.error('Error fetching listings:', error));
  */

  // Add geolocation functionality
  document.getElementById('find-me-button')?.addEventListener('click', function() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          
          // Center map on user's location
          map.setView([userLat, userLng], 14);
          
          // Add a marker for the user's location
          const userMarker = L.marker([userLat, userLng]).addTo(map);
          userMarker.bindPopup("You are here").openPopup();
        },
        error => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please check your browser permissions.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  });
});
