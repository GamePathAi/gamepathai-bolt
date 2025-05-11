import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = 'https://iafamwvctehdltqmnhyx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZmFtd3ZjdGVoZGx0cW1uaHl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MDc4MjEsImV4cCI6MjA2MDI4MzgyMX0.fSA1zetUFf2VGWpC8G0EbkRj29AWNSSpla4WCH16CVw';

// Debug logging
console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Found' : 'Missing');

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables'
  );
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(
    'Invalid VITE_SUPABASE_URL format. Please provide a valid URL.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage,
    storageKey: 'gamepath-auth',
    debug: import.meta.env.DEV
  },
  global: {
    headers: {
      'X-Client-Info': 'gamepath-ai@1.0.0'
    }
  }
});