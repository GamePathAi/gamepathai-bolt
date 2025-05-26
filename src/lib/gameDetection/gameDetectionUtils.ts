const path = require('path-browserify');

// Known game platforms and their common paths
const PLATFORMS = {
  STEAM: 'Steam',
  EPIC: 'Epic',
  XBOX: 'Xbox',
  ORIGIN: 'Origin',
  UBISOFT: 'Ubisoft Connect',
  BATTLE_NET: 'Battle.net',
  GOG: 'GOG',
  RIOT: 'Riot',
  OTHER: 'Other'
};

// Common game directories to prioritize
const COMMON_GAME_DIRS = [
  // Steam
  'Program Files (x86)\\Steam\\steamapps\\common',
  'Program Files\\Steam\\steamapps\\common',
  // Epic Games
  'Program Files\\Epic Games',
  'Program Files (x86)\\Epic Games',
  // Xbox/Microsoft
  'Program Files\\WindowsApps',
  'XboxGames',
  // Origin
  'Program Files (x86)\\Origin Games',
  'Program Files\\Origin Games',
  // Ubisoft
  'Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games',
  'Program Files\\Ubisoft\\Ubisoft Game Launcher\\games',
  // Battle.net
  'Program Files (x86)\\Battle.net',
  'Program Files\\Battle.net',
  // GOG
  'Program Files (x86)\\GOG Galaxy\\Games',
  'Program Files\\GOG Galaxy\\Games',
  'GOG Games'
];

// Check if file is likely a game executable
function isLikelyGameExecutable(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;
  
  const filename = path.basename(filePath).toLowerCase();
  
  // Skip common non-game executables
  const blacklist = [
    'uninstall', 'setup', 'installer', 'updater', 'crash',
    'bug', 'report', 'helper', 'vcredist', 'dxsetup', 'dotnet',
    'prereq', 'redist', 'config', 'settings', 'launcher_updater'
  ];
  
  for (const item of blacklist) {
    if (filename.includes(item)) return false;
  }
  
  return filename.endsWith('.exe');
}

// Check if file exists
async function fileExists(filePath) {
  try {
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.fs) {
      return await window.electronAPI.fs.exists(filePath);
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Normalize game name
function normalizeGameName(name) {
  if (!name) return '';
  return name
    .replace(/[®™©]/g, '')
    .replace(/\s*[-–—:]\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = {
  PLATFORMS,
  COMMON_GAME_DIRS,
  isLikelyGameExecutable,
  fileExists,
  normalizeGameName
};
