const getSteamGames = require("./getSteamGames");
const getEpicGames = require("./getEpicGames");
const getXboxGames = require("./getXboxGames");
const {  
  mockGetSteamGames, 
  mockGetEpicGames, 
  mockGetXboxGames, 
  mockGetOriginGames,
  mockGetBattleNetGames,
  mockGetGOGGames,
  mockGetUplayGames
 } = require("./mockPlatforms");

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