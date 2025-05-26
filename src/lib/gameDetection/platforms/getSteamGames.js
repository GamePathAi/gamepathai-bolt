const fs = require("fs/promises");
const path = require("path-browserify");
const os = require("os");
const {  isLikelyGameExecutable, fileExists  } = require("../gameDetectionUtils");
const {  isElectron  } = require("../isElectron");

/**
 * @typedef {Object} SteamGame
 * @property {string} id - Unique identifier for the game
 * @property {string} name - Name of the game
 * @property {string} platform - Gaming platform (e.g., "Steam")
 * @property {string} installPath - Path where the game is installed
 * @property {string} executablePath - Path to the game's executable
 * @property {string} process_name - Name of the game's process
 * @property {number} size - Size of the game in MB
 * @property {string} [icon_url] - URL of the game's icon
 * @property {Date} [last_played] - When the game was last played
 */

// Steam game blacklist - these are not actual games but tools, redistributables, etc.
const STEAM_GAME_BLACKLIST = [
  'Steamworks Common Redistributables',
  'Steam Linux Runtime',
  'Proton',
  'Steam Controller Configs',
  'Steamworks Shared',
  'Steam Workshop Tools',
  'Dedicated Server',
  'SDK',
  'Server',
  'Demo',
  'Test',
  'Tool',
  'Redistributable',
  'Redist',
  'VR',
  'Runtime',
  'Common',
  'DirectX',
  'dotNET',
  'PhysX',
  'Visual C++',
  'Microsoft Visual C++',
  'Microsoft DirectX',
  'Microsoft .NET',
  'Microsoft XNA',
  'Microsoft Games for Windows',
  'Microsoft Games for Windows - LIVE',
  'Microsoft Games for Windows Marketplace',
  'Microsoft Games for Windows - LIVE Redistributable',
  'Microsoft Games for Windows - LIVE Client',
  'Microsoft Games for Windows - LIVE Redistributable'
];

// Maximum number of games to return per platform to prevent overwhelming the UI
const MAX_GAMES_PER_PLATFORM = 50;

/**
 * Checks if a Steam game should be included in the results
 * @param {string} name - Name of the game to check
 * @returns {boolean} Whether the game should be included
 */
function isSteamGameValid(name) {
  // Check if the game is in the blacklist
  return !STEAM_GAME_BLACKLIST.some(blacklisted => 
    name.toLowerCase().includes(blacklisted.toLowerCase())
  );
}

/**
 * Retrieves installed Steam games
 * @returns {Promise} Array of installed Steam games
 */
async function getSteamGames() {
  try {
    // Check if we're in Electron environment
    if (!isElectron()) {
      console.log("Steam detection requires Electron environment");
      return [];
    }

    const { fs, registry, Registry } = window.electronAPI;
    const homedir = (await window.electronAPI.fs.getSystemPaths()).home;

    // Find Steam installation directory
    let steamPath = "";
    
    // Try registry on Windows
    if (window.electronAPI.system.platform === "win32") {
      try {
        steamPath = await registry.getValue(
          Registry.HKEY.CURRENT_USER,
          "SOFTWARE\\Valve\\Steam",
          "SteamPath"
        );
        
        // Try LOCAL_MACHINE if not found in CURRENT_USER
        if (!steamPath) {
          steamPath = await registry.getValue(
            Registry.HKEY.LOCAL_MACHINE,
            "SOFTWARE\\WOW6432Node\\Valve\\Steam",
            "InstallPath"
          );
        }
      } catch (error) {
        console.error("Error reading Steam path from registry:", error);
      }
    }
    
    // Default paths for different platforms
    if (!steamPath) {
      const defaultPaths = {
        win32: [
          "C:\\Program Files (x86)\\Steam",
          "C:\\Program Files\\Steam",
        ],
        darwin: [
          path.join(homedir, "Library/Application Support/Steam"),
        ],
        linux: [
          path.join(homedir, ".steam/steam"),
          path.join(homedir, ".local/share/Steam"),
        ],
      };
      
      const platformPaths = defaultPaths[window.electronAPI.system.platform] || [];
      
      // Check each default path
      for (const defaultPath of platformPaths) {
        if (await fs.exists(defaultPath)) {
          steamPath = defaultPath;
          break;
        }
      }
    }
    
    if (!steamPath) {
      console.log("Steam installation not found");
      return [];
    }
    
    console.log(`Steam installation found at: ${steamPath}`);
    
    // Find Steam game libraries
    const libraries = [steamPath];
    
    // Read libraryfolders.vdf to find additional libraries
    try {
      // Possible paths for libraryfolders.vdf
      const libraryFoldersPaths = [
        path.join(steamPath, "steamapps", "libraryfolders.vdf"), // Newer path
        path.join(steamPath, "config", "libraryfolders.vdf"), // Older path
      ];
      
      let libraryFoldersContent = "";
      
      for (const libPath of libraryFoldersPaths) {
        try {
          if (await fs.exists(libPath)) {
            libraryFoldersContent = await fs.readFile(libPath);
            break;
          }
        } catch {
          // File doesn't exist, try next
        }
      }
      
      if (libraryFoldersContent) {
        // Extract library paths
        const pathRegex = /"path"\s+"([^"]+)"/g;
        const matches = Array.from(libraryFoldersContent.matchAll(pathRegex));
        
        for (const match of matches) {
          libraries.push(match[1].replace(/\\\\/g, "\\"));
        }
        
        // Try alternative format if no paths found
        if (libraries.length === 1) {
          const altRegex = /"([0-9]+)"\s+{[^}]*?"path"\s+"([^"]+)"/g;
          const altMatches = Array.from(libraryFoldersContent.matchAll(altRegex));
          
          for (const match of altMatches) {
            libraries.push(match[2].replace(/\\\\/g, "\\"));
          }
        }
      }
    } catch (error) {
      console.error("Error reading Steam library folders:", error);
    }
    
    console.log(`Found ${libraries.length} Steam libraries: ${libraries.join(", ")}`);
    
    // Scan each library for games
    const games = [];
    
    for (const library of libraries) {
      const appsDir = path.join(library, "steamapps");
      
      try {
        // Check if steamapps directory exists
        if (await fs.exists(appsDir)) {
          // Read directory for manifest files
          const files = await fs.readDir(appsDir);
          
          // Filter for game manifest files
          const manifestFiles = files.filter(file => 
            file.name.startsWith("appmanifest_") && file.name.endsWith(".acf")
          );
          
          for (const manifestFile of manifestFiles) {
            try {
              const manifestPath = manifestFile.path;
              const manifestContent = await fs.readFile(manifestPath);
              
              // Extract manifest information
              const appIdMatch = /"appid"\s+"(\d+)"/.exec(manifestContent);
              const nameMatch = /"name"\s+"([^"]+)"/.exec(manifestContent);
              const installDirMatch = /"installdir"\s+"([^"]+)"/.exec(manifestContent);
              const sizeOnDiskMatch = /"SizeOnDisk"\s+"(\d+)"/.exec(manifestContent);
              const lastPlayedMatch = /"LastPlayed"\s+"(\d+)"/.exec(manifestContent);
              
              if (appIdMatch && nameMatch && installDirMatch) {
                const appId = appIdMatch[1];
                const name = nameMatch[1];
                const installDir = installDirMatch[1];
                
                // Skip blacklisted games
                if (!isSteamGameValid(name)) {
                  console.log(`Skipping blacklisted Steam item: ${name}`);
                  continue;
                }
                
                // Calculate size in MB
                const sizeInBytes = sizeOnDiskMatch ? parseInt(sizeOnDiskMatch[1]) : 0;
                const sizeInMB = Math.round(sizeInBytes / (1024 * 1024));
                
                // Last played date
                const lastPlayed = lastPlayedMatch ? new Date(parseInt(lastPlayedMatch[1]) * 1000) : undefined;
                
                // Game installation path
                const installPath = path.join(appsDir, "common", installDir);
                
                // Find main executable
                let executablePath = "";
                let processName = "";
                
                if (await fs.exists(installPath)) {
                  try {
                    const gameFiles = await fs.readDir(installPath);
                    const exeFiles = gameFiles.filter(file => file.name.toLowerCase().endsWith(".exe"));
                    
                    if (exeFiles.length > 0) {
                      // Prefer executable with same name as install directory
                      const mainExe = exeFiles.find(file => 
                        file.name.toLowerCase() === `${installDir.toLowerCase()}.exe`
                      ) || exeFiles[0];
                      
                      executablePath = mainExe.path;
                      processName = mainExe.name;
                    }
                  } catch (error) {
                    console.log(`Could not scan executables for ${name}: ${error}`);
                  }
                }
                
                // Steam game icon URL
                const iconUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
                
                games.push({
                  id: `steam-${appId}`,
                  name,
                  platform: "Steam",
                  installPath,
                  executablePath,
                  process_name: processName,
                  size: sizeInMB,
                  icon_url: iconUrl,
                  last_played: lastPlayed
                });
                
                console.log(`Found Steam game: ${name} (${appId})`);
                
                // Limit number of games
                if (games.length >= MAX_GAMES_PER_PLATFORM) {
                  console.log(`Reached maximum number of Steam games (${MAX_GAMES_PER_PLATFORM}), stopping scan`);
                  break;
                }
              }
            } catch (error) {
              console.error(`Error processing Steam manifest ${manifestFile.name}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Error reading Steam apps directory ${appsDir}:`, error);
      }
    }
    
    return games;
  } catch (error) {
    console.error("Error scanning Steam games:", error);
    return [];
  }
}

module.exports = getSteamGames;

module.exports = {  getSteamGames  }