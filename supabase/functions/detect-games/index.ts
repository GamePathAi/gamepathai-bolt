import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { 
        auth: { persistSession: false },
        db: { schema: 'public' }
      }
    );

    // Mock game detection logic
    const detectedGames = [
      {
        name: 'Cyberpunk 2077',
        platform: 'Steam',
        process_name: 'Cyberpunk2077.exe',
        install_path: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Cyberpunk 2077',
        icon_url: 'https://images.pexels.com/photos/2007647/pexels-photo-2007647.jpeg',
        size: 102400, // 100GB in MB
        optimized: true
      },
      {
        name: 'League of Legends',
        platform: 'Riot',
        process_name: 'LeagueClient.exe',
        install_path: 'C:\\Riot Games\\League of Legends',
        icon_url: 'https://images.pexels.com/photos/7915578/pexels-photo-7915578.jpeg',
        size: 15360, // 15GB in MB
        optimized: true
      },
      {
        name: 'Fortnite',
        platform: 'Epic',
        process_name: 'FortniteClient-Win64-Shipping.exe',
        install_path: 'C:\\Program Files\\Epic Games\\Fortnite',
        icon_url: 'https://images.pexels.com/photos/7915426/pexels-photo-7915426.jpeg',
        size: 26624, // 26GB in MB
        optimized: false
      }
    ];

    try {
      // Insert detected games into the database
      const { error: upsertError } = await supabaseClient
        .from('games')
        .upsert(
          detectedGames.map(game => ({
            ...game,
            updated_at: new Date().toISOString()
          })),
          {
            onConflict: 'name,platform',
            ignoreDuplicates: false
          }
        );

      if (upsertError) {
        console.error('Database upsert error:', upsertError);
        throw upsertError;
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return new Response(
        JSON.stringify({
          success: false,
          games: [],
          errors: ['Failed to update game database']
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Return the detected games
    return new Response(
      JSON.stringify({ 
        success: true, 
        games: detectedGames,
        errors: []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in detect-games function:', error);
    
    // Return a more detailed error message
    return new Response(
      JSON.stringify({ 
        success: false,
        games: [],
        errors: [error instanceof Error ? error.message : 'Internal server error occurred']
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});