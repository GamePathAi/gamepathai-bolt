import { mockGetSteamGames, mockGetEpicGames, mockGetXboxGames, mockGetOriginGames,
  mockGetBattleNetGames, mockGetGOGGames, mockGetUplayGames } from "./mockPlatforms";
import { isElectron } from "../isElectron";

// Dynamically import platform-specific modules only in Electron environment
let getSteamGames = mockGetSteamGames;
let getEpicGames = mockGetEpicGames;
let getXboxGames = mockGetXboxGames;
let getOriginGames = mockGetOriginGames;
let getBattleNetGames = mockGetBattleNetGames;
let getGOGGames = mockGetGOGGames;
let getUplayGames = mockGetUplayGames;

// Only attempt to import these modules in Electron environment
if (isElectron()) {
  try {
    // Try to load the real implementations
    import { getSteamGames } from "./getSteamGames";
    import { getEpicGames } from "./getEpicGames";
    import { getXboxGames } from "./getXboxGames";
    import { getOriginGames } from "./getOriginGames";
    import { getBattleNetGames } from "./getBattleNetGames";
    import { getGOGGames } from "./getGOGGames";
    import { getUplayGames } from "./getUplayGames";
    
    console.log('âœ… Successfully loaded real game detection modules');
  } catch (error) {
    console.error('âŒ Error loading game detection modules:', error);
    console.log('âš ï¸ Falling back to mock implementations');
  }
}

// Export all platform-specific game detection functions
module.exports = { 
  getSteamGames,
  getEpicGames,
  getXboxGames,
  getOriginGames,
  getBattleNetGames,
  getGOGGames,
  getUplayGames,
  // Also export mock implementations for web environment
  mockGetSteamGames,
  mockGetEpicGames,
  mockGetXboxGames,
  mockGetOriginGames,
  mockGetBattleNetGames,
  mockGetGOGGames,
  mockGetUplayGames
};
