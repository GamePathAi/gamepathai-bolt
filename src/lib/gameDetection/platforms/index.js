const {  mockGetSteamGames, mockGetEpicGames, mockGetXboxGames, mockGetOriginGames, 
  mockGetBattleNetGames, mockGetGOGGames, mockGetUplayGames  } = require("./mockPlatforms");
const {  isElectron  } = require("../isElectron");

// Dynamically import platform-specific modules only in Electron environment
let getSteamGames;
let getEpicGames;
let getXboxGames;

// Only attempt to import these modules in Electron environment
if (isElectron()) {
  try {
    // Import from JS files (converted by the prebuild script)
    import('./getSteamGames').then(module => {
      getSteamGames = module.getSteamGames;
    }).catch(err => {
      console.error('Error importing getSteamGames:', err);
      getSteamGames = mockGetSteamGames;
    });

    import('./getEpicGames').then(module => {
      getEpicGames = module.getEpicGames;
    }).catch(err => {
      console.error('Error importing getEpicGames:', err);
      getEpicGames = mockGetEpicGames;
    });

    import('./getXboxGames').then(module => {
      getXboxGames = module.getXboxGames;
    }).catch(err => {
      console.error('Error importing getXboxGames:', err);
      getXboxGames = mockGetXboxGames;
    });
  } catch (error) {
    console.error('Error importing game detection modules:', error);
    // Fall back to mock implementations
    getSteamGames = mockGetSteamGames;
    getEpicGames = mockGetEpicGames;
    getXboxGames = mockGetXboxGames;
  }
} else {
  // In web environment, use mock implementations
  getSteamGames = mockGetSteamGames;
  getEpicGames = mockGetEpicGames;
  getXboxGames = mockGetXboxGames;
}

// Export all platform-specific game detection functions
module.exports = { 
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