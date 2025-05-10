```typescript
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
}

interface ScanResult {
  games: GameInfo[];
  errors: string[];
}

class GameScanner {
  private static instance: GameScanner;
  private readonly commonPaths = {
    steam: {
      windows: 'C:\\Program Files (x86)\\Steam\\steamapps\\common',
      linux: '~/.local/share/Steam/steamapps/common',
      mac: '~/Library/Application Support/Steam/steamapps/common'
    },
    epic: {
      windows: 'C:\\Program Files\\Epic Games',
      linux: '~/.local/share/Epic',
      mac: '~/Library/Application Support/Epic'
    },
    gog: {
      windows: 'C:\\Program Files (x86)\\GOG Galaxy\\Games',
      linux: '~/.local/share/GOG',
      mac: '~/Library/Application Support/GOG.com'
    }
  };

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
      // Call the Supabase Edge Function to perform the scan
      const { data, error } = await supabase.functions.invoke('detect-games', {
        body: { paths: this.commonPaths }
      });

      if (error) throw error;

      return {
        games: data.games,
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

  public async addGame(gameInfo: GameInfo): Promise<GameInfo> {
    try {
      const { data, error } = await supabase
        .from('games')
        .insert(gameInfo)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding game:', error);
      throw error;
    }
  }

  public async updateGame(gameId: string, updates: Partial<GameInfo>): Promise<GameInfo> {
    try {
      const { data, error } = await supabase
        .from('games')
        .update(updates)
        .eq('id', gameId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating game:', error);
      throw error;
    }
  }

  public async launchGame(gameId: string): Promise<void> {
    try {
      const { data: game, error } = await supabase
        .from('games')
        .select()
        .eq('id', gameId)
        .single();

      if (error) throw error;

      // Update last played timestamp
      await this.updateGame(gameId, {
        last_played: new Date()
      });

      // Launch the game through the edge function
      await supabase.functions.invoke('launch-game', {
        body: { path: game.install_path }
      });
    } catch (error) {
      console.error('Error launching game:', error);
      throw error;
    }
  }

  public async validateGameFiles(gameId: string): Promise<boolean> {
    try {
      const { data } = await supabase.functions.invoke('validate-game', {
        body: { gameId }
      });

      return data.valid;
    } catch (error) {
      console.error('Error validating game files:', error);
      return false;
    }
  }
}

export const gameScanner = GameScanner.getInstance();
```