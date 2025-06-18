// js/supabaseClient.js - Fixed to use environment variables properly

// For client-side (browser) usage, get from window.SUPABASE_CONFIG
// This should be set by your server when rendering the page
let SUPABASE_URL, SUPABASE_ANON_KEY;

if (typeof window !== 'undefined' && window.SUPABASE_CONFIG) {
    // Browser environment - use config injected by server
    SUPABASE_URL = window.SUPABASE_CONFIG.url;
    SUPABASE_ANON_KEY = window.SUPABASE_CONFIG.key;
    console.log('✅ Using Supabase config from window.SUPABASE_CONFIG');
} else if (typeof process !== 'undefined' && process.env) {
    // Node.js environment - use environment variables
    SUPABASE_URL = process.env.SUPABASE_URL;
    SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    console.log('✅ Using Supabase config from environment variables');
} else {
    // Fallback - hardcoded values (only for development)
    SUPABASE_URL = 'https://gdmdurzaeezcrgrmtabx.supabase.co';
    SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkbWR1cnphZWV6Y3Jncm10YWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1OTk3MDUsImV4cCI6MjA2MzE3NTcwNX0.xbuXRr2jDAAG021blK5zeuqwO-5zMNq7_tEfW_oW7cQ';
    console.warn('⚠️ Using hardcoded Supabase credentials - set SUPABASE_CONFIG or environment variables');
}

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Supabase configuration missing!');
    console.error('SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'MISSING');
    console.error('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
    throw new Error('Supabase configuration is incomplete');
}

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make it globally available
window.supabase = supabase;

// Also make config available for other scripts
if (!window.SUPABASE_CONFIG) {
    window.SUPABASE_CONFIG = {
        url: SUPABASE_URL,
        key: SUPABASE_ANON_KEY
    };
}

console.log('✅ Supabase client initialized');
console.log('📍 Project URL:', SUPABASE_URL);
console.log('🔑 Using anon key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { supabase, SUPABASE_URL, SUPABASE_ANON_KEY };
}