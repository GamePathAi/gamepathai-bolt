import { processScanner } from './processScanner';
import { supabase } from '../supabase';

interface GameInfo {
  id?: string;
  name: string;
  platform: string;
  process_name: string;
  install_path: string;
}

export class GameManager {
  private static instance: GameManager;
  private scanInterval: number | null = null;
  private readonly SCAN_INTERVAL = 30000; // 30 seconds

  private constructor() {}

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  public startMonitoring(): void {
    if (this.scanInterval) return;

    this.scanInterval = window.setInterval(async () => {
      await this.scanAndUpdateGames();
    }, this.SCAN_INTERVAL);

    // Initial scan
    this.scanAndUpdateGames();
  }

  public stopMonitoring(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  private async scanAndUpdateGames(): Promise<void> {
    try {
      const gameProcesses = await processScanner.scanForGames();
      
      for (const process of gameProcesses) {
        const gameDetails = await processScanner.getGameDetails(process);
        await this.updateGameInDatabase({
          name: process.name,
          platform: this.detectPlatform(process.path),
          process_name: process.name,
          install_path: process.path,
        });
      }
    } catch (error) {
      console.error('Error scanning and updating games:', error);
    }
  }

  private detectPlatform(installPath: string): string {
    if (!installPath) return 'Unknown';

    const path = installPath.toLowerCase();
    if (path.includes('steam')) return 'Steam';
    if (path.includes('epic games')) return 'Epic Games';
    if (path.includes('battle.net')) return 'Battle.net';
    if (path.includes('riot games')) return 'Riot';
    return 'Unknown';
  }

  private async updateGameInDatabase(gameInfo: GameInfo): Promise<void> {
    try {
      const { error } = await supabase
        .from('games')
        .upsert(
          { 
            ...gameInfo,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'name, platform',
          }
        );

      if (error) throw error;
    } catch (error) {
      console.error('Error updating game in database:', error);
    }
  }

  public async getInstalledGames(): Promise<GameInfo[]> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching installed games:', error);
      return [];
    }
  }
}

export const gameManager = GameManager.getInstance();