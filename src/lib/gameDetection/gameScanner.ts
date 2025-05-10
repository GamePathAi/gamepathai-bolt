import { supabase } from '../supabase';
import { gameSignatures, searchPaths } from './config';
import type { GameInfo } from './types';

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

  public async getInstalledGames() {
    try {
      return await supabase
        .from('games')
        .select('*')
        .order('name', { ascending: true });
    } catch (error) {
      console.error('Error fetching installed games:', error);
      throw error;
    }
  }

  public async scanForGames(): Promise<ScanResult> {
    try {
      // Call the detect-games edge function with game signatures and search paths
      const { data, error } = await supabase.functions.invoke('detect-games', {
        body: { 
          signatures: gameSignatures,
          paths: searchPaths
        }
      });

      if (error) throw error;

      return {
        games: data.games || [],
        errors: data.errors || []
      };
    } catch (error) {
      console.error('Error scanning for games:', error);
      return {
        games: [],
        errors: [error instanceof Error ? error.message : 'Failed to scan for games']
      };
    }
  }

  public async validateGameFiles(gameId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('validate-game', {
        body: { gameId }
      });

      if (error) throw error;
      return data?.valid ?? false;
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