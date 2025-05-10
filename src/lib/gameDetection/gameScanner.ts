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

  // Mock data for development
  private readonly mockGames: GameInfo[] = [
    {
      name: 'Cyberpunk 2077',
      platform: 'Steam',
      process_name: 'Cyberpunk2077.exe',
      install_path: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Cyberpunk 2077',
      icon_url: 'https://images.pexels.com/photos/2007647/pexels-photo-2007647.jpeg',
      size: 102400,
      optimized: true
    },
    {
      name: 'League of Legends',
      platform: 'Riot',
      process_name: 'LeagueClient.exe',
      install_path: 'C:\\Riot Games\\League of Legends',
      icon_url: 'https://images.pexels.com/photos/7915578/pexels-photo-7915578.jpeg',
      size: 15360,
      optimized: true
    },
    {
      name: 'Fortnite',
      platform: 'Epic',
      process_name: 'FortniteClient-Win64-Shipping.exe',
      install_path: 'C:\\Program Files\\Epic Games\\Fortnite',
      icon_url: 'https://images.pexels.com/photos/7915426/pexels-photo-7915426.jpeg',
      size: 26624,
      optimized: false
    },
    {
      name: 'Counter-Strike 2',
      platform: 'Steam',
      process_name: 'cs2.exe',
      install_path: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive',
      icon_url: 'https://images.pexels.com/photos/7915449/pexels-photo-7915449.jpeg',
      size: 35840,
      optimized: true
    }
  ];

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
      // In development, return mock data
      const insertedGames = [];
      const errors = [];

      for (const game of this.mockGames) {
        try {
          const { data, error } = await supabase
            .from('games')
            .upsert(game, {
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
        games: insertedGames,
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

  public async validateGameFiles(gameId: string): Promise<boolean> {
    // In development, always return true
    return true;
  }

  public async launchGame(gameId: string): Promise<void> {
    // In development, just log the launch
    console.log(`Launching game ${gameId}`);
  }
}

export const gameScanner = GameScanner.getInstance();