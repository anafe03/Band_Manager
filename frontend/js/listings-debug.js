// listings-debug.js
// Debug script to test listings database connection and add sample data

class ListingsDebugger {
  constructor() {
    this.supabaseUrl = window.SUPABASE_CONFIG?.url;
    this.supabaseKey = window.SUPABASE_CONFIG?.key;
  }

  async testConnection() {
    console.log('🔍 Testing Supabase connection...');
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.error('❌ Supabase configuration missing');
      return false;
    }

    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/listings?select=count`, {
        method: 'GET',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Connection test response:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Database connection successful');
        console.log('📊 Current listings count:', data.length);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Database connection failed:', errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ Connection error:', error);
      return false;
    }
  }

  async checkIfTableExists() {
    console.log('🔍 Checking if listings table exists...');
    
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/listings?limit=1`, {
        method: 'GET',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ Listings table exists');
        return true;
      } else if (response.status === 404) {
        console.error('❌ Listings table does not exist');
        return false;
      } else {
        const errorText = await response.text();
        console.error('❌ Error checking table:', errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ Error checking table existence:', error);
      return false;
    }
  }

  async getSampleListings() {
    return [
      {
        title: "Modern Downtown Loft",
        description: "Stunning contemporary loft in the heart of downtown with exposed brick walls, hardwood floors, and floor-to-ceiling windows offering breathtaking city views.",
        price: 525000,
        address: "123 Main Street",
        city: "Austin",
        state: "TX",
        zip_code: "78701",
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1400,
        lot_size: null,
        year_built: 2018,
        property_type: "loft",
        features: ["hardwood_floors", "exposed_brick", "city_views", "modern_appliances"],
        images: [
          "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
        ],
        status: "active",
        views: 0
      },
      {
        title: "Charming Victorian Home",
        description: "Beautiful historic Victorian home with original details, wraparound porch, and mature landscaping. Recently updated kitchen and bathrooms.",
        price: 675000,
        address: "456 Elm Avenue",
        city: "Austin",
        state: "TX",
        zip_code: "78704",
        bedrooms: 4,
        bathrooms: 3,
        sqft: 2800,
        lot_size: "0.3 acres",
        year_built: 1895,
        property_type: "house",
        features: ["wraparound_porch", "original_details", "mature_landscaping", "updated_kitchen"],
        images: [
          "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
          "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
        ],
        status: "active",
        views: 0
      },
      {
        title: "Luxury Waterfront Condo",
        description: "Exquisite waterfront condominium with panoramic lake views, premium finishes, and resort-style amenities including pool, gym, and concierge service.",
        price: 850000,
        address: "789 Lakeshore Drive",
        city: "Austin",
        state: "TX",
        zip_code: "78703",
        bedrooms: 3,
        bathrooms: 2.5,
        sqft: 2100,
        lot_size: null,
        year_built: 2020,
        property_type: "condo",
        features: ["waterfront", "lake_views", "pool", "gym", "concierge"],
        images: [
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
        ],
        status: "active",
        views: 0
      },
      {
        title: "Cozy Suburban Family Home",
        description: "Perfect family home in quiet neighborhood with large backyard, updated kitchen, master suite, and excellent schools nearby.",
        price: 425000,
        address: "321 Oak Street",
        city: "Round Rock",
        state: "TX",
        zip_code: "78664",
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1850,
        lot_size: "0.25 acres",
        year_built: 2005,
        property_type: "house",
        features: ["large_backyard", "updated_kitchen", "master_suite", "excellent_schools"],
        images: [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
        ],
        status: "active",
        views: 0
      },
      {
        title: "Trendy East Austin Townhouse",
        description: "Modern townhouse in trendy East Austin with rooftop deck, open floor plan, and walking distance to restaurants and entertainment.",
        price: 475000,
        address: "654 Cedar Lane",
        city: "Austin",
        state: "TX",
        zip_code: "78702",
        bedrooms: 2,
        bathrooms: 2.5,
        sqft: 1600,
        lot_size: null,
        year_built: 2019,
        property_type: "townhouse",
        features: ["rooftop_deck", "open_floor_plan", "walkable", "modern_design"],
        images: [
          "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
          "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
        ],
        status: "active",
        views: 0
      }
    ];
  }

  async addSampleData() {
    console.log('🌱 Adding sample listings data...');
    
    const sampleListings = await this.getSampleListings();
    
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/listings`, {
        method: 'POST',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(sampleListings)
      });

      if (response.ok) {
        const insertedData = await response.json();
        console.log('✅ Sample data added successfully!');
        console.log('📊 Inserted', insertedData.length, 'listings');
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Error adding sample data:', errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ Error adding sample data:', error);
      return false;
    }
  }

  async runFullDiagnostic() {
    console.log('🚀 Running listings diagnostic...');
    
    // Test 1: Connection
    const connectionOk = await this.testConnection();
    if (!connectionOk) {
      console.log('❌ Diagnostic failed at connection test');
      return;
    }

    // Test 2: Table exists
    const tableExists = await this.checkIfTableExists();
    if (!tableExists) {
      console.log('❌ Diagnostic failed: listings table does not exist');
      console.log('💡 You need to create the listings table in Supabase first');
      return;
    }

    // Test 3: Check current data
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/listings?select=*`, {
        method: 'GET',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const listings = await response.json();
        console.log('📊 Current listings in database:', listings.length);
        
        if (listings.length === 0) {
          console.log('📭 Database is empty. Would you like to add sample data?');
          console.log('💡 Run: window.listingsDebugger.addSampleData()');
        } else {
          console.log('✅ Database has listings data');
          console.log('🏠 Sample listing:', listings[0]);
        }
      }
    } catch (error) {
      console.error('❌ Error checking current data:', error);
    }

    console.log('✅ Diagnostic complete');
  }
}

// Auto-initialize when script loads
window.addEventListener('DOMContentLoaded', () => {
  if (window.SUPABASE_CONFIG) {
    window.listingsDebugger = new ListingsDebugger();
    console.log('🔧 Listings debugger ready. Run window.listingsDebugger.runFullDiagnostic()');
  }
});