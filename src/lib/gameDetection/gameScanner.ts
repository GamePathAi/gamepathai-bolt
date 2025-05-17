import type { GameInfo } from './types';

// Mock implementation for web environment
const mockGameScanner = {
  getInstalledGames: async (): Promise<{ data: GameInfo[] | null; error: Error | null }> => {
    // Mock data for development
    const mockGames: GameInfo[] = [
      {
        id: 'cs2',
        name: 'Counter-Strike 2',
        platform: 'Steam',
        process_name: 'cs2.exe',
        install_path: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike 2',
        size: 35 * 1024, // 35 GB in MB
        icon_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg',
      },
      {
        id: 'cyberpunk',
        name: 'Cyberpunk 2077',
        platform: 'Steam',
        process_name: 'Cyberpunk2077.exe',
        install_path: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Cyberpunk 2077',
        size: 100 * 1024, // 100 GB in MB
        icon_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg',
      },
      {
        id: 'fortnite',
        name: 'Fortnite',
        platform: 'Epic',
        process_name: 'FortniteClient-Win64-Shipping.exe',
        install_path: 'C:\\Program Files\\Epic Games\\Fortnite',
        size: 26 * 1024, // 26 GB in MB
        icon_url: 'https://cdn2.unrealengine.com/24br-s24-egs-launcher-productart-1920x1080-1920x1080-ec04a20bd189.jpg',
      },
      {
        id: 'lol',
        name: 'League of Legends',
        platform: 'Riot',
        process_name: 'LeagueClient.exe',
        install_path: 'C:\\Riot Games\\League of Legends',
        size: 15 * 1024, // 15 GB in MB
        icon_url: 'https://www.leagueoflegends.com/static/open-graph-2e582ae9fae8b0b396ca46ff21fd47a8.jpg',
      }
    ];
    
    // Simulate a small network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: mockGames, error: null };
  },
  
  scanForGames: async (): Promise<{ success: boolean; data: GameInfo[]; errors: string[] }> => {
    // Simulate a scan
    await new Promise(resolve => setTimeout(resolve, 2000));
    const mockGames = await mockGameScanner.getInstalledGames();
    return { success: true, data: mockGames.data || [], errors: [] };
  },
  
  validateGameFiles: async (gameId: string): Promise<boolean> => {
    return true;
  },
  
  launchGame: async (gameId: string): Promise<boolean> => {
    console.log('Mock: Game would be launched if in Electron', gameId);
    return true;
  },
  
  optimizeGame: async (gameId: string, profile: string = 'balanced', settings?: any): Promise<boolean> => {
    console.log(`Mock: Game ${gameId} would be optimized if in Electron with profile ${profile}`);
    return true;
  }
};

// Determine if we're in Electron or web environment
const isElectron = typeof window !== 'undefined' && window.electronAPI;

// Export the appropriate implementation
export const gameScanner = isElectron 
  ? window.electronAPI 
  : mockGameScanner;