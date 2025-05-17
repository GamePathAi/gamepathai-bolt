import * as path from 'path';
import type { GameInfo } from './types';

// Known game platforms and their common paths
export const GAME_PLATFORMS = {
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
export const GAME_DIRECTORIES = [
  // Steam
  'Program Files (x86)\\Steam\\steamapps\\common',
  'Program Files\\Steam\\steamapps\\common',
  'SteamLibrary\\steamapps\\common',
  // Epic
  'Program Files\\Epic Games',
  'Program Files (x86)\\Epic Games',
  // Origin/EA
  'Program Files (x86)\\Origin Games',
  'Program Files\\Origin Games',
  'Program Files\\EA Games',
  'Program Files (x86)\\EA Games',
  // Xbox
  'XboxGames',
  'Program Files\\WindowsApps\\Microsoft',
  'Program Files\\ModifiableWindowsApps',
  // Ubisoft
  'Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games',
  'Program Files\\Ubisoft\\Ubisoft Game Launcher\\games',
  // Battle.net
  'Program Files (x86)\\Battle.net\\Games',
  'Program Files\\Battle.net\\Games',
  // GOG
  'Program Files (x86)\\GOG Galaxy\\Games',
  'Program Files\\GOG Galaxy\\Games',
  // Riot
  'Riot Games',
  'Program Files\\Riot Games',
  'Program Files (x86)\\Riot Games'
];

// Known non-game applications to filter out
export const NON_GAME_APPLICATIONS = [
  // Browsers
  'chrome.exe', 'firefox.exe', 'msedge.exe', 'opera.exe', 'brave.exe', 'iexplore.exe',
  // System utilities
  'explorer.exe', 'cmd.exe', 'powershell.exe', 'taskmgr.exe', 'regedit.exe', 'mmc.exe',
  // Common applications
  'notepad.exe', 'calc.exe', 'mspaint.exe', 'winword.exe', 'excel.exe', 'outlook.exe',
  // Development tools
  'code.exe', 'devenv.exe', 'git.exe', 'node.exe', 'npm.exe', 'python.exe',
  // Utilities
  'discord.exe', 'slack.exe', 'teams.exe', 'zoom.exe', 'skype.exe',
  // Windows components
  'svchost.exe', 'rundll32.exe', 'conhost.exe', 'dllhost.exe', 'services.exe',
  // Update services
  'MicrosoftEdgeUpdate.exe', 'GoogleUpdate.exe', 'updater.exe', 'setup.exe', 'installer.exe',
  // Other common non-games
  'OneDrive.exe', 'Dropbox.exe', 'GoogleDrive.exe', 'iCloudDrive.exe',
  'Spotify.exe', 'iTunes.exe', 'vlc.exe', 'wmplayer.exe',
  'acrobat.exe', 'adobereader.exe', 'photoshop.exe', 'illustrator.exe'
];

// Known game-related executables and patterns
export const GAME_EXECUTABLES_PATTERNS = [
  // Common game engines
  /unreal/i, /unity/i, /cryengine/i, /godot/i, /game/i, /play/i,
  // Common game file patterns
  /launcher/i, /client/i, /engine/i, /x64/i, /bin/i,
  // Common game platforms
  /steam/i, /epic/i, /origin/i, /galaxy/i, /uplay/i, /battle\.net/i,
  // Common game genres
  /rpg/i, /fps/i, /mmo/i, /moba/i, /rts/i, /racing/i, /sports/i,
  // Common game publishers
  /ea/i, /ubisoft/i, /bethesda/i, /rockstar/i, /valve/i, /blizzard/i, /activision/i,
  /2k/i, /bandai/i, /capcom/i, /cdprojekt/i, /konami/i, /namco/i, /sega/i, /square/i
];

// Minimum size for a game executable (in bytes)
export const MIN_GAME_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Determines if a path is likely to be a game directory
 */
export function isGameDirectory(dirPath: string): boolean {
  if (!dirPath) return false;
  
  const normalizedPath = dirPath.replace(/\\/g, '/').toLowerCase();
  
  // Check if path contains known game directories
  return GAME_DIRECTORIES.some(dir => {
    const normalizedDir = dir.replace(/\\/g, '/').toLowerCase();
    return normalizedPath.includes(normalizedDir);
  });
}

/**
 * Determines if a path is likely to be a system directory (not a game)
 */
export function isSystemDirectory(dirPath: string): boolean {
  if (!dirPath) return false;
  
  const normalizedPath = dirPath.replace(/\\/g, '/').toLowerCase();
  const systemDirs = [
    '/windows/', '/program files/microsoft', '/program files (x86)/microsoft',
    '/program files/common files/', '/program files (x86)/common files/',
    '/windows defender/', '/microsoft office/', '/windowsapps/desktop',
    '/windowsapps/microsoft.windows', '/system32/', '/programdata/microsoft'
  ];
  
  return systemDirs.some(dir => normalizedPath.includes(dir));
}

/**
 * Determines if an executable is likely to be a game
 */
export function isLikelyGameExecutable(executablePath: string, size?: number): boolean {
  if (!executablePath) return false;
  
  const fileName = path.basename(executablePath).toLowerCase();
  const dirPath = path.dirname(executablePath);
  
  // Check if it's in a known non-game list
  if (NON_GAME_APPLICATIONS.some(app => fileName === app.toLowerCase())) {
    return false;
  }
  
  // Check if it's in a system directory
  if (isSystemDirectory(dirPath)) {
    return false;
  }
  
  // Check if it's in a known game directory
  if (isGameDirectory(dirPath)) {
    return true;
  }
  
  // Check file size if available
  if (size !== undefined && size < MIN_GAME_SIZE) {
    return false;
  }
  
  // Check if the name matches common game patterns
  return GAME_EXECUTABLES_PATTERNS.some(pattern => pattern.test(fileName));
}

/**
 * Detects the platform of a game based on its path
 */
export function detectGamePlatform(installPath: string): string {
  if (!installPath) return GAME_PLATFORMS.OTHER;
  
  const normalizedPath = installPath.replace(/\\/g, '/').toLowerCase();
  
  if (normalizedPath.includes('/steam/') || normalizedPath.includes('/steamapps/')) {
    return GAME_PLATFORMS.STEAM;
  } else if (normalizedPath.includes('/epic games/')) {
    return GAME_PLATFORMS.EPIC;
  } else if (normalizedPath.includes('/xbox') || normalizedPath.includes('/windowsapps/microsoft')) {
    return GAME_PLATFORMS.XBOX;
  } else if (normalizedPath.includes('/origin') || normalizedPath.includes('/ea games/')) {
    return GAME_PLATFORMS.ORIGIN;
  } else if (normalizedPath.includes('/ubisoft/') || normalizedPath.includes('/uplay/')) {
    return GAME_PLATFORMS.UBISOFT;
  } else if (normalizedPath.includes('/battle.net/') || normalizedPath.includes('/blizzard/')) {
    return GAME_PLATFORMS.BATTLE_NET;
  } else if (normalizedPath.includes('/gog/') || normalizedPath.includes('/galaxy/')) {
    return GAME_PLATFORMS.GOG;
  } else if (normalizedPath.includes('/riot games/')) {
    return GAME_PLATFORMS.RIOT;
  }
  
  return GAME_PLATFORMS.OTHER;
}

/**
 * Filters a list of games to remove duplicates and non-games
 */
export function filterAndDeduplicateGames(games: GameInfo[]): GameInfo[] {
  if (!Array.isArray(games)) return [];
  
  // First, filter out non-games
  const filteredGames = games.filter(game => {
    // Skip if no install path or process name
    if (!game.install_path || !game.process_name) return false;
    
    // Check if it's a likely game executable
    return isLikelyGameExecutable(
      path.join(game.install_path, game.process_name),
      game.size
    );
  });
  
  // Then, deduplicate by name and platform
  const uniqueGames = new Map<string, GameInfo>();
  
  for (const game of filteredGames) {
    const key = `${game.name}|${game.platform}`.toLowerCase();
    
    // If we already have this game, keep the one with more information
    if (uniqueGames.has(key)) {
      const existing = uniqueGames.get(key)!;
      
      // Prefer games with icons, size information, and last played data
      if (
        (game.icon_url && !existing.icon_url) ||
        (game.size && (!existing.size || game.size > existing.size)) ||
        (game.last_played && (!existing.last_played || new Date(game.last_played) > new Date(existing.last_played)))
      ) {
        uniqueGames.set(key, game);
      }
    } else {
      uniqueGames.set(key, game);
    }
  }
  
  return Array.from(uniqueGames.values());
}

/**
 * Enhances game information with additional metadata
 */
export function enhanceGameInfo(game: GameInfo): GameInfo {
  // If platform is not set, try to detect it
  if (!game.platform && game.install_path) {
    game.platform = detectGamePlatform(game.install_path);
  }
  
  // Generate a default icon URL based on platform if none exists
  if (!game.icon_url) {
    switch (game.platform) {
      case GAME_PLATFORMS.STEAM:
        // Try to extract Steam AppID from install path
        const steamAppIdMatch = game.install_path?.match(/\/steamapps\/common\/([^\/]+)/i);
        if (steamAppIdMatch && steamAppIdMatch[1]) {
          // This is just a placeholder - in a real implementation, you'd use the actual Steam API
          game.icon_url = `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamAppIdMatch[1]}/header.jpg`;
        }
        break;
      // Add other platform-specific icon logic here
    }
  }
  
  return game;
}

/**
 * Prioritizes games based on platform and other factors
 */
export function prioritizeGames(games: GameInfo[]): GameInfo[] {
  if (!Array.isArray(games)) return [];
  
  // Define platform priority (lower number = higher priority)
  const platformPriority: Record<string, number> = {
    [GAME_PLATFORMS.STEAM]: 1,
    [GAME_PLATFORMS.EPIC]: 2,
    [GAME_PLATFORMS.XBOX]: 3,
    [GAME_PLATFORMS.BATTLE_NET]: 4,
    [GAME_PLATFORMS.ORIGIN]: 5,
    [GAME_PLATFORMS.UBISOFT]: 6,
    [GAME_PLATFORMS.GOG]: 7,
    [GAME_PLATFORMS.RIOT]: 8,
    [GAME_PLATFORMS.OTHER]: 9
  };
  
  // Sort games by platform priority, then by last played (if available), then by name
  return [...games].sort((a, b) => {
    // First, sort by platform priority
    const aPriority = platformPriority[a.platform] || 999;
    const bPriority = platformPriority[b.platform] || 999;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // Then, sort by last played date (most recent first)
    if (a.last_played && b.last_played) {
      return new Date(b.last_played).getTime() - new Date(a.last_played).getTime();
    } else if (a.last_played) {
      return -1; // a has last_played, b doesn't
    } else if (b.last_played) {
      return 1; // b has last_played, a doesn't
    }
    
    // Finally, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });
}