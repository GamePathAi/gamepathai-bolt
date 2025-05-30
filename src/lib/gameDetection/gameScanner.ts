import path from 'path';
import { getSteamGames } from './platforms/getSteamGames';
import { getEpicGames } from './platforms/getEpicGames';
import { getXboxGames } from './platforms/getXboxGames';
import { getOriginGames } from './platforms/getOriginGames';
import { getBattleNetGames } from './platforms/getBattleNetGames';
import { getGOGGames } from './platforms/getGOGGames';
import { getUplayGames } from './platforms/getUplayGames';
import { filterAndDeduplicateGames, prioritizeGames, enhanceGameInfo } from './gameDetectionUtils';
import { isElectron } from './isElectron';

// Interface for communication with Electron
interface ElectronAPI {
  getInstalledGames?: () => Promise<GameInfo[]>;
  scanGames?: () => Promise<{ success: boolean; data: GameInfo[]; errors: string[] }>;
  validateGameFiles?: (gameId: string) => Promise<boolean>;
  launchGame?: (gameId: string) => Promise<boolean>;
  optimizeGame?: (gameId: string, profile?: string, settings?: any) => Promise<boolean>;
}

// Web implementation
class GameScannerWeb {
  async getInstalledGames(): Promise<{ data: GameInfo[] | null; error: Error | null }> {
    try {
      // Simulate a small network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Combine games from different platforms
      const steamGames = await getSteamGames();
      const epicGames = await getEpicGames();
      const xboxGames = await getXboxGames();
      const originGames = await getOriginGames();
      const battleNetGames = await getBattleNetGames();
      const gogGames = await getGOGGames();
      const uplayGames = await getUplayGames();
      
      const allGames = [
        ...steamGames,
        ...epicGames,
        ...xboxGames,
        ...originGames,
        ...battleNetGames,
        ...gogGames,
        ...uplayGames
      ];
      
      // Filter, deduplicate and prioritize games
      const processedGames = prioritizeGames(
        filterAndDeduplicateGames(
          allGames.map(enhanceGameInfo)
        )
      );
      
      console.log(`GameScannerWeb: Processed ${processedGames.length} games from ${allGames.length} total detected`);
      
      return { data: processedGames, error: null };
    } catch (error) {
      console.error('Error getting installed games:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
  
  async scanForGames(): Promise<{ success: boolean; data: GameInfo[]; errors: string[] }> {
    try {
      // Simulate a scan
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data, error } = await this.getInstalledGames();
      
      if (error) {
        return { 
          success: false, 
          data: [], 
          errors: [error.message] 
        };
      }
      
      return { 
        success: true, 
        data: data || [], 
        errors: [] 
      };
    } catch (error) {
      console.error('Error scanning for games:', error);
      return { 
        success: false, 
        data: [],
        errors: [error instanceof Error ? error.message : 'Unknown error during scan'] 
      };
    }
  }
  
  async validateGameFiles(gameId: string): Promise<boolean> {
    console.log(`Mock: Validating game files for ${gameId}`);
    return true;
  }
  
  async launchGame(gameId: string): Promise<boolean> {
    console.log(`Mock: Launching game ${gameId}`);
    return true;
  }
  
  async optimizeGame(gameId: string, profile: string = 'balanced', settings?: any): Promise<boolean> {
    console.log(`Mock: Optimizing game ${gameId} with profile ${profile}`);
    return true;
  }
}

// Electron implementation
class GameScannerElectron {
  private api: ElectronAPI;
  
  constructor(api: ElectronAPI) {
    this.api = api;
  }
  
  private processXboxGames(games: any[]): GameInfo[] {
    const processedGames: GameInfo[] = [];
    const xboxGameMap: Record<string, { name: string; exe: string }> = {
      'BO6': { name: 'Call of Duty: Black Ops 6', exe: 'cod_bo6.exe' },
      'MW3': { name: 'Call of Duty: Modern Warfare III', exe: 'cod23-cod.exe' },
      'MWII': { name: 'Call of Duty: Modern Warfare II', exe: 'cod22-cod.exe' },
      'Call of Duty': { name: 'Call of Duty', exe: 'cod.exe' }
    };

    for (const game of games) {
      if (game && game.path) {
        const folderName = path.basename(game.path);
        for (const [key, info] of Object.entries(xboxGameMap)) {
          if (folderName.includes(key)) {
            processedGames.push({
              id: `xbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: info.name,
              platform: 'PC',
              path: game.path,
              executablePath: path.join(game.path, info.exe),
              isInstalled: true,
              lastPlayed: null,
              playtime: 0,
              favorite: false,
              addedAt: new Date().toISOString(),
              coverUrl: `/assets/games/${key.toLowerCase().replace(/\s+/g, '-')}.jpg`
            });
            break;
          }
        }
      }
    }

    return processedGames;
  }
  
  async getInstalledGames(): Promise<{ data: GameInfo[] | null; error: Error | null }> {
    try {
      let games: GameInfo[] = [];
      
      if (this.api.getInstalledGames) {
        games = await this.api.getInstalledGames();
        console.log('[GameScanner] getInstalledGames retornou:', games);
        if (!Array.isArray(games)) {
          console.warn('[GameScanner] games não é um array, usando array vazio');
          games = [];
        }
      } else if (this.api.scanGames) {
        const result = await this.api.scanGames();
        console.log('[GameScanner] scanGames resultado:', result);
        games = result.data;
      } else {
        throw new Error('No method available to get installed games');
      }
      
      // Process Xbox games
      const xboxProcessedGames = this.processXboxGames(games);
      // Merge with other games, avoiding duplicates
      games = [
        ...xboxProcessedGames,
        ...games.filter(g => !xboxProcessedGames.some(xb => xb.path === g.path))
      ];
      
      // Process games to filter non-games and improve data quality
      const processedGames = prioritizeGames(
        filterAndDeduplicateGames(
          (Array.isArray(games) ? games : []).map(enhanceGameInfo)
        )
      );
      
      console.log(`GameScannerElectron: Processed ${processedGames.length} games from ${games.length} total detected`);
      
      return { data: processedGames, error: null };
    } catch (error) {
      console.error('Error getting installed games:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
  
  async scanForGames(): Promise<{ success: boolean; data: GameInfo[]; errors: string[] }> {
    try {
      if (this.api.scanGames) {
        const result = await this.api.scanGames();
        
        // Process games to filter non-games and improve data quality
        const processedGames = prioritizeGames(
          filterAndDeduplicateGames(
            result.data.map(enhanceGameInfo)
          )
        );
        
        console.log(`GameScannerElectron: Processed ${processedGames.length} games from ${result.data.length} total detected`);
        
        return {
          success: result.success,
          data: processedGames,
          errors: result.errors
        };
      } else {
        throw new Error('scanGames method not available');
      }
    } catch (error) {
      console.error('Error scanning for games:', error);
      return { 
        success: false, 
        data: [],
        errors: [error instanceof Error ? error.message : 'Unknown error during scan'] 
      };
    }
  }
  
  async validateGameFiles(gameId: string): Promise<boolean> {
    try {
      if (this.api.validateGameFiles) {
        return await this.api.validateGameFiles(gameId);
      } else {
        console.warn('validateGameFiles method not available, returning true');
        return true;
      }
    } catch (error) {
      console.error('Error validating game files:', error);
      return false;
    }
  }
  
  async launchGame(gameId: string): Promise<boolean> {
    try {
      if (this.api.launchGame) {
        return await this.api.launchGame(gameId);
      } else {
        throw new Error('launchGame method not available');
      }
    } catch (error) {
      console.error('Error launching game:', error);
      return false;
    }
  }
  
  async optimizeGame(gameId: string, profile: string = 'balanced', settings?: any): Promise<boolean> {
    try {
      if (this.api.optimizeGame) {
        return await this.api.optimizeGame(gameId, profile, settings);
      } else {
        throw new Error('optimizeGame method not available');
      }
    } catch (error) {
      console.error('Error optimizing game:', error);
      return false;
    }
  }
}

// Determine if we're in Electron or web environment
const electronEnv = isElectron();
console.log(`GameScanner: Running in ${electronEnv ? 'Electron' : 'Web'} environment`);

// Create the appropriate implementation
const scanner = electronEnv 
  ? new GameScannerElectron(window.electronAPI as unknown as ElectronAPI)
  : new GameScannerWeb();

// Export the game scanner
export const gameScanner = scanner;
