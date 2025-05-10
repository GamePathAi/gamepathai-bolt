import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import * as path from 'node:path';
import * as fs from 'node:fs';

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
    const { paths, signatures } = await req.json();
    const detectedGames = [];
    const errors = [];

    // Helper function to check if a file exists
    const fileExists = async (filePath: string) => {
      try {
        await Deno.stat(filePath);
        return true;
      } catch {
        return false;
      }
    };

    // Helper function to get file size
    const getFileSize = async (filePath: string) => {
      try {
        const stat = await Deno.stat(filePath);
        return stat.size;
      } catch {
        return 0;
      }
    };

    // Scan each platform's paths
    for (const [platform, platformPaths] of Object.entries(paths)) {
      for (const basePath of platformPaths.windows) { // Start with Windows paths
        try {
          if (await fileExists(basePath)) {
            const entries = await Deno.readDir(basePath);
            for await (const entry of entries) {
              if (entry.isDirectory) {
                const gamePath = path.join(basePath, entry.name);
                
                // Check each game signature
                for (const [gameName, signature] of Object.entries(signatures)) {
                  const matchesSignature = await Promise.all(
                    signature.files.map(file => 
                      fileExists(path.join(gamePath, file))
                    )
                  );

                  if (matchesSignature.every(exists => exists)) {
                    const size = await getFileSize(gamePath);
                    detectedGames.push({
                      name: gameName,
                      platform: signature.platform,
                      process_name: path.basename(signature.files[0]),
                      install_path: gamePath,
                      size,
                      optimized: false,
                      icon_url: null, // Will be populated by the frontend
                      updated_at: new Date().toISOString()
                    });
                  }
                }
              }
            }
          }
        } catch (error) {
          errors.push(`Error scanning ${basePath}: ${error.message}`);
        }
      }
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

    // Update database with detected games
    const insertedGames = [];
    for (const game of detectedGames) {
      try {
        const { data, error: upsertError } = await supabaseClient
          .from('games')
          .upsert(game, {
            onConflict: 'name,platform'
          })
          .select()
          .single();

        if (upsertError) {
          errors.push(`Failed to update ${game.name}: ${upsertError.message}`);
        } else if (data) {
          insertedGames.push(data);
        }
      } catch (error) {
        errors.push(`Failed to process ${game.name}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        games: insertedGames,
        errors
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in detect-games function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        games: [],
        errors: [error instanceof Error ? error.message : 'Internal server error']
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});