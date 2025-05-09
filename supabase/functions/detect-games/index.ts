import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Mock game detection logic
    // In a real implementation, this would scan the system for installed games
    const detectedGames = [
      {
        name: 'Cyberpunk 2077',
        platform: 'Steam',
        process_name: 'Cyberpunk2077.exe',
        install_path: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Cyberpunk 2077',
      },
      {
        name: 'League of Legends',
        platform: 'Riot',
        process_name: 'LeagueClient.exe',
        install_path: 'C:\\Riot Games\\League of Legends',
      },
    ];

    // Insert detected games into the database
    for (const game of detectedGames) {
      const { error } = await supabaseClient
        .from('games')
        .upsert(
          { ...game },
          { onConflict: 'name, platform' }
        );

      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ success: true, games: detectedGames }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});