import getSteamGames from './getSteamGames';
import getEpicGames from './getEpicGames';
import getXboxGames from './getXboxGames';
import { 
  mockGetSteamGames, 
  mockGetEpicGames, 
  mockGetXboxGames, 
  mockGetOriginGames,
  mockGetBattleNetGames,
  mockGetGOGGames,
  mockGetUplayGames
} from './mockPlatforms';

// Export all platform-specific game detection functions
export {
  getSteamGames,
  getEpicGames,
  getXboxGames,
  // Mock implementations for web environment
  mockGetSteamGames,
  mockGetEpicGames,
  mockGetXboxGames,
  mockGetOriginGames,
  mockGetBattleNetGames,
  mockGetGOGGames,
  mockGetUplayGames
};