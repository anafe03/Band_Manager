import { createClient } from '@supabase/supabase-js';

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Supabase URL or API key is missing in environment variables.');
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const { data, error } = await supabase.auth.signInWithPassword({
  email: process.env.SUPABASE_EMAIL, // Use email from environment variables
  password: process.env.SUPABASE_PASSWORD, // Use password from environment variables
});

if (error) {
  console.error('Error signing in:', error);
  throw new Error('Failed to sign in to Supabase');
}

console.log('ACCESS TOKEN:', data?.session?.access_token);
