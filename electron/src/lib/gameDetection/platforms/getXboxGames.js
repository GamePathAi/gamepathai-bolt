const fs = require('fs/promises');
const path = require('path');
const os = require('os');

// If we're on Windows, use Registry
let Registry;
try {
  Registry = require('registry-js').Registry;
} catch {
  Registry = undefined;
}

/**
 * Checks if a package is a real game based on its name and other indicators
 */
function isActualGame(packageName) {
  // Filter out obvious system apps
  const systemKeywords = ['Runtime', 'VCLibs', 'Framework', 'Desktop', 'NET'];
  if (systemKeywords.some(keyword => packageName.includes(keyword))) {
    return false;
  }
  
  // Check for game indicators in the package name
  const gameIndicators = [
    'Games', 'Gaming', 'Game', 'Play', 'Xbox', 'Forza', 'Halo', 'Gears',
    'Minecraft', 'CallofDuty', 'COD', 'ModernWarfare', 'Warzone', 'FIFA',
    'Battlefield', 'Assassin', 'Creed', 'FarCry', 'Destiny', 'Fallout',
    'GrandTheftAuto', 'GTA', 'RedDead', 'Witcher', 'Cyberpunk', 'Doom',
    'ElderScrolls', 'Skyrim', 'Fortnite', 'LeagueOfLegends', 'Overwatch',
    'RainbowSix', 'Siege', 'RocketLeague', 'SeaOfThieves', 'StarWars'
  ];
  
  if (gameIndicators.some(indicator => packageName.includes(indicator))) {
    return true;
  }
  
  // Additional heuristics
  if (packageName.includes('Game') || packageName.includes('game') || 
      packageName.includes('Play') || packageName.includes('play')) {
    return true;
  }
  
  // Default to false for Microsoft packages that don't match game indicators
  if (packageName.startsWith('Microsoft.')) {
    return false;
  }
  
  // For non-Microsoft packages, be more lenient
  return !packageName.includes('App') && 
         !packageName.includes('Tool') && 
         !packageName.includes('Utility');
}

/**
 * Checks if a directory contains game files
 */
async function containsGameFiles(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    
    // Check for common game extensions
    const gameExtensions = [".exe", ".dll", ".pak", ".dat", ".bin", ".ini", ".cfg"];
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (gameExtensions.includes(ext)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Finds executables recursively in a directory
 */
async function findExecutablesRecursively(dirPath, maxDepth = 3) {
  if (maxDepth <= 0) return [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let executables = [];
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively search in subdirectories
        const subDirExecutables = await findExecutablesRecursively(fullPath, maxDepth - 1);
        executables = executables.concat(subDirExecutables);
      } else if (entry.name.toLowerCase().endsWith(".exe")) {
        executables.push(fullPath);
      }
    }
    
    return executables;
  } catch (error) {
    return [];
  }
}

/**
 * Busca jogos instalados via Xbox App/Microsoft Store
 */
async function getXboxGames() {
  try {
    // Check if we're on Windows
    if (process.platform !== "win32") {
      console.log("Xbox Games scanning is only supported on Windows");
      return [];
    }
    
    // Possible Xbox game installation locations
    const possiblePaths = [
      "C:\\XboxGames",
      "D:\\XboxGames", 
      "E:\\XboxGames",
      "C:\\Program Files\\WindowsApps",
      "C:\\Program Files\\ModifiableWindowsApps"
    ];
    
    // Try to find additional paths from registry
    if (Registry) {
      try {
        const xboxPath = Registry.getValue(
          Registry.HKEY.LOCAL_MACHINE,
          "SOFTWARE\\Microsoft\\GamingServices",
          "GameInstallPath"
        );
        
        if (xboxPath && !possiblePaths.includes(xboxPath)) {
          possiblePaths.push(xboxPath);
        }
      } catch (error) {
        console.warn("Could not read Xbox game path from registry:", error);
      }
    }
    
    // Get environment variables for additional paths
    const localAppData = process.env.LOCALAPPDATA;
    const programFiles = process.env.PROGRAMFILES;
    const programFilesX86 = process.env['PROGRAMFILES(X86)'];
    
    if (localAppData) {
      possiblePaths.push(path.join(localAppData, "Packages"));
    }
    
    if (programFiles) {
      possiblePaths.push(path.join(programFiles, "WindowsApps"));
    }
    
    if (programFilesX86) {
      possiblePaths.push(path.join(programFilesX86, "WindowsApps"));
    }
    
    const games = [];
    
    // Scan each possible path
    for (const basePath of possiblePaths) {
      try {
        if (await fileExists(basePath)) {
          console.log(`Scanning Xbox games in: ${basePath}`);
          
          const entries = await fs.readdir(basePath, { withFileTypes: true });
          
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const gamePath = path.join(basePath, entry.name);
              
              // Skip if not a game package
              if (!isActualGame(entry.name)) {
                console.log(`Skipping non-game package: ${entry.name}`);
                continue;
              }
              
              // Check if it's an Xbox game directory
              const isXboxGame = entry.name.startsWith("Microsoft.") || 
                                gamePath.includes("XboxGames") ||
                                await containsGameFiles(gamePath);
              
              if (!isXboxGame) {
                continue;
              }
              
              // Try to find the game name
              let gameName = entry.name;
              
              // Remove common Microsoft prefixes
              if (gameName.startsWith("Microsoft.")) {
                gameName = gameName.replace(/^Microsoft\.[^_]+_[\d\.]+_[^_]+_[^\\]+\\?/, "");
                
                // Clean up the name further
                gameName = gameName
                  .replace(/([a-z])([A-Z])/g, '$1 $2') // Add spaces between camelCase
                  .replace(/^[a-z]/, c => c.toUpperCase()); // Capitalize first letter
              }
              
              // Special case for Call of Duty
              if (gameName.includes("CallofDuty") || gameName.includes("COD") || 
                  gameName.includes("ModernWarfare") || gameName.includes("Warzone")) {
                gameName = "Call of Duty";
              }
              
              // Try to find the main executable
              let executablePath = "";
              let processName = "";
              
              try {
                const gameFiles = await findExecutablesRecursively(gamePath);
                
                // Filter for executables that seem to be games
                const gameExecutables = gameFiles.filter(file => 
                  !path.basename(file).toLowerCase().includes("setup") &&
                  !path.basename(file).toLowerCase().includes("unins") &&
                  !path.basename(file).toLowerCase().includes("crash") &&
                  !path.basename(file).toLowerCase().includes("launcher")
                );
                
                if (gameExecutables.length > 0) {
                  executablePath = gameExecutables[0];
                  processName = path.basename(executablePath);
                } else if (gameFiles.length > 0) {
                  // If no game executables found, use the first executable
                  executablePath = gameFiles[0];
                  processName = path.basename(executablePath);
                }
              } catch (error) {
                console.warn(`Could not scan executables for Xbox game ${gameName}:`, error);
              }
              
              // Calculate game size
              let sizeInMB = 0;
              try {
                const stats = await fs.stat(gamePath);
                if (stats && stats.size) {
                  sizeInMB = Math.round(stats.size / (1024 * 1024));
                }
              } catch (error) {
                console.warn(`Could not determine size for Xbox game ${gameName}:`, error);
              }
              
              // Add game to the list even without executable for Xbox (UWP apps)
              games.push({
                id: `xbox-${entry.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`,
                name: gameName,
                platform: "Xbox",
                installPath: gamePath,
                executablePath: executablePath || gamePath, // Use path as fallback
                process_name: processName || entry.name,
                size: sizeInMB,
                icon_url: undefined,
                last_played: undefined
              });
              
              console.log(`Found Xbox game: ${gameName}`);
              
              // Limit the number of games to prevent overwhelming the UI
              if (games.length >= 50) {
                console.log(`Reached maximum number of Xbox games (50), stopping scan`);
                break;
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Could not access Xbox games path ${basePath}:`, error);
      }
    }
    
    return games;
  } catch (error) {
    console.error("Error scanning Xbox games:", error);
    return [];
  }
}

// Utility function to check if a file exists
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

module.exports = { getXboxGames };