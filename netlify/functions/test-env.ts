import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  // Log environment variables for debugging
  console.log('Environment variables check:');
  console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Found' : 'Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'Found' : 'Missing');

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Environment variables status',
      hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
      hasSupabaseKey: !!process.env.VITE_SUPABASE_ANON_KEY,
      // Don't expose actual values in response
      timestamp: new Date().toISOString()
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  };
};