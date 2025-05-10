import { supabase } from '../supabase';

export interface GameInfo {
  id?: string;
  name: string;
  platform: string;
  process_name: string;
  install_path: string;
  icon_url?: string;
  last_played?: Date;
  size?: number;
  optimized?: boolean;
  status?: string;
  version?: string;
}

interface ScanResult {
  games: GameInfo[];
  errors: string[];
}

class GameScanner {
  private static instance: GameScanner;

  private constructor() {}

  public static getInstance(): GameScanner {
    if (!GameScanner.instance) {
      GameScanner.instance = new GameScanner();
    }
    return GameScanner.instance;
  }

  public async scanForGames(): Promise<ScanResult> {
    console.log('Scanning for games...');
    
    try {
      // Get all installed games from database
      const { data: existingGames, error: fetchError } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'installed');

      if (fetchError) {
        throw fetchError;
      }

      // Scan system for new games
      const newGames = await this.scanSystem();
      
      // Update database with new games
      const insertedGames = [];
      const errors = [];

      for (const game of newGames) {
        try {
          const { data, error } = await supabase
            .from('games')
            .upsert({
              ...game,
              status: 'installed',
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'name,platform'
            })
            .select()
            .single();

          if (error) {
            errors.push(`Failed to update ${game.name}: ${error.message}`);
          } else if (data) {
            insertedGames.push(data);
          }
        } catch (error) {
          errors.push(`Failed to process ${game.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        games: [...(existingGames || []), ...insertedGames],
        errors
      };

    } catch (error) {
      console.error('Error scanning for games:', error);
      return {
        games: [],
        errors: [error instanceof Error ? error.message : 'Failed to scan for games']
      };
    }
  }

  private async scanSystem(): Promise<GameInfo[]> {
    // This would be replaced with actual system scanning logic
    // For now, return empty array since actual scanning is handled by edge function
    return [];
  }

  public async validateGameFiles(gameId: string): Promise<boolean> {
    try {
      const { data: game, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (error) throw error;
      if (!game) return false;

      // Validate game files
      const { data: validation } = await supabase.functions.invoke('validate-game', {
        body: { gameId }
      });

      return validation?.valid ?? false;
    } catch (error) {
      console.error('Error validating game files:', error);
      return false;
    }
  }

  public async launchGame(gameId: string): Promise<void> {
    try {
      // Update last_played timestamp
      const { error: updateError } = await supabase
        .from('games')
        .update({ 
          last_played: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId);

      if (updateError) throw updateError;

      // Launch game through edge function
      await supabase.functions.invoke('launch-game', {
        body: { gameId }
      });
    } catch (error) {
      console.error('Error launching game:', error);
      throw error;
    }
  }
}

export const gameScanner = GameScanner.getInstance();