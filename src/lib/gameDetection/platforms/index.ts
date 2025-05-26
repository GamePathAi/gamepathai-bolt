const getSteamGames = require("./getSteamGames");
const getEpicGames = require("./getEpicGames");
const getXboxGames = require("./getXboxGames");
// Export all platform-specific game detection functions
module.exports = { 
  getSteamGames,
  getEpicGames,
  getXboxGames,
  // Mock implementations for web environment
  () => [],
  () => [],
  () => [],
  () => [],
  () => [],
  () => [],
  () => []
 };