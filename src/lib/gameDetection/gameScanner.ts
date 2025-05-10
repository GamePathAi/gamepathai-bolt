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
      windows: [
        'C:\\Program Files (x86)\\Steam\\steamapps\\common',
        'C:\\Program Files\\Steam\\steamapps\\common',
        'D:\\Steam\\steamapps\\common'
      ],
      linux: [
        '~/.local/share/Steam/steamapps/common',
        '~/.steam/steam/steamapps/common'
      ],
      mac: ['~/Library/Application Support/Steam/steamapps/common']
    },
    epic: {
      windows: [
        'C:\\Program Files\\Epic Games',
        'C:\\Program Files (x86)\\Epic Games',
        'D:\\Epic Games'
      ],
      linux: ['~/.local/share/Epic'],
      mac: ['~/Library/Application Support/Epic']
    },
    origin: {
      windows: [
        'C:\\Program Files\\Origin Games',
        'C:\\Program Files (x86)\\Origin Games'
      ]
    },
    battlenet: {
      windows: [
        'C:\\Program Files\\Battle.net\\Games',
        'C:\\Program Files (x86)\\Battle.net\\Games'
      ]
    },
    riot: {
      windows: [
        'C:\\Riot Games',
        'C:\\Program Files\\Riot Games',
        'D:\\Riot Games'
      ]
    },
    gog: {
      windows: [
        'C:\\Program Files\\GOG Galaxy\\Games',
        'C:\\Program Files (x86)\\GOG Galaxy\\Games'
      ]
    }
  };

  private readonly gameSignatures = {
    'League of Legends': {
      files: ['LeagueClient.exe', 'Game/League of Legends.exe'],
      platform: 'Riot'
    },
    'Valorant': {
      files: ['VALORANT.exe', 'ShooterGame/Binaries/Win64/VALORANT-Win64-Shipping.exe'],
      platform: 'Riot'
    },
    'Cyberpunk 2077': {
      files: ['bin/x64/Cyberpunk2077.exe'],
      platform: 'Steam'
    },
    'Red Dead Redemption 2': {
      files: ['RDR2.exe'],
      platform: 'Steam'
    },
    'Counter-Strike 2': {
      files: ['game/csgo/bin/win64/cs2.exe'],
      platform: 'Steam'
    },
    'Fortnite': {
      files: ['FortniteGame/Binaries/Win64/FortniteClient-Win64-Shipping.exe'],
      platform: 'Epic'
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
      const { data, error } = await supabase.functions.invoke('detect-games', {
        body: { 
          paths: this.commonPaths,
          signatures: this.gameSignatures
        }
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(`Failed to scan for games: ${error.message}`);
      }

      if (!data || !data.success) {
        const errorMessage = data?.errors?.[0] || 'Unknown error occurred';
        throw new Error(`Game scanning failed: ${errorMessage}`);
      }

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
      const { error: launchError } = await supabase.functions.invoke('launch-game', {
        body: { path: game.install_path }
      });

      if (launchError) throw launchError;
    } catch (error) {
      console.error('Error launching game:', error);
      throw error;
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
}

export const gameScanner = GameScanner.getInstance();