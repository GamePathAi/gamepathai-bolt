import getSteamGames from './getSteamGames';
import getEpicGames from './getEpicGames';
import getXboxGames from './getXboxGames';
import getOriginGames from './getOriginGames';
import getBattleNetGames from './getBattleNetGames';
import getGOGGames from './getGOGGames';
import getUplayGames from './getUplayGames';
import { 
  mockGetSteamGames, 
  mockGetEpicGames, 
  mockGetXboxGames, 
  mockGetOriginGames,
  mockGetBattleNetGames
} from './mockPlatforms';

// Export all platform-specific game detection functions
export {
  getSteamGames,
  getEpicGames,
  getXboxGames,
  getOriginGames,
  getBattleNetGames,
  getGOGGames,
  getUplayGames,
  // Mock implementations for web environment
  mockGetSteamGames,
  mockGetEpicGames,
  mockGetXboxGames,
  mockGetOriginGames,
  mockGetBattleNetGames
};