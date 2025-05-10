import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { gameId } = await req.json();

    if (!gameId) {
      throw new Error('Game ID is required');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        auth: { persistSession: false },
        db: { schema: 'public' }
      }
    );

    // Get game info
    const { data: game, error: fetchError } = await supabaseClient
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!game) {
      throw new Error('Game not found');
    }

    // Validate required fields
    const valid = Boolean(
      game.install_path && 
      game.process_name &&
      game.name &&
      game.platform
    );

    return new Response(
      JSON.stringify({ 
        valid,
        game
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in validate-game function:', error);
    
    return new Response(
      JSON.stringify({ 
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        },
        status: 200, // Keep 200 to handle error in client
      }
    );
  }
});