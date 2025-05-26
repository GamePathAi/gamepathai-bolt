const { mockGetSteamGames, mockGetEpicGames, mockGetXboxGames, mockGetOriginGames, 
  mockGetBattleNetGames, mockGetGOGGames, mockGetUplayGames } = require("./mockPlatforms");
const { isElectron } = require("../isElectron");

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
    getSteamGames = require('./getSteamGames').getSteamGames;
    getEpicGames = require('./getEpicGames').getEpicGames;
    getXboxGames = require('./getXboxGames').getXboxGames;
    getOriginGames = require('./getOriginGames').getOriginGames;
    getBattleNetGames = require('./getBattleNetGames').getBattleNetGames;
    getGOGGames = require('./getGOGGames').getGOGGames;
    getUplayGames = require('./getUplayGames').getUplayGames;
    
    console.log('✅ Successfully loaded real game detection modules');
  } catch (error) {
    console.error('❌ Error loading game detection modules:', error);
    console.log('⚠️ Falling back to mock implementations');
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