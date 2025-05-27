import type { GameInfo } from './types';
import { mockGetSteamGames, mockGetEpicGames, mockGetXboxGames, mockGetOriginGames, 
  mockGetBattleNetGames, mockGetGOGGames, mockGetUplayGames } from './platforms/mockPlatforms';
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
      const steamGames = await mockGetSteamGames();
      const epicGames = await mockGetEpicGames();
      const xboxGames = await mockGetXboxGames();
      const originGames = await mockGetOriginGames();
      const battleNetGames = await mockGetBattleNetGames();
      const gogGames = await mockGetGOGGames();
      const uplayGames = await mockGetUplayGames();
      
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
  
  async getInstalledGames(): Promise<{ data: GameInfo[] | null; error: Error | null }> {
    try {
      let games: GameInfo[] = [];
      
      if (this.api.getInstalledGames) {
        games = await this.api.getInstalledGames();
      } else if (this.api.scanGames) {
        const result = await this.api.scanGames();
        games = result.data;
      } else {
        throw new Error('No method available to get installed games');
      }
      
      // Process games to filter non-games and improve data quality
      const processedGames = prioritizeGames(
        filterAndDeduplicateGames(
          games.map(enhanceGameInfo)
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