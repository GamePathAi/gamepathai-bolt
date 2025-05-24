import { useState, useCallback } from 'react';
import type { GameInfo, DetectionResult, DetectorOptions } from '../../lib/gameDetection/types';
import { Platform } from '../../lib/gameDetection/types';
import { useLocalStorage } from '../useLocalStorage';
import path from 'path-browserify';

export function useSteamDetector() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getItem, setItem } = useLocalStorage();

  const detect = useCallback(async (options: DetectorOptions = {}): Promise<DetectionResult> => {
    if (isDetecting) {
      return { platform: Platform.Steam, games: [], error: 'Detection already in progress' };
    }

    setIsDetecting(true);
    setError(null);

    try {
      // Check if we should use cache
      if (options.useCache !== false) {
        const cachedGames = await getItem<GameInfo[]>('steam-games');
        const cachedTime = await getItem<string>('steam-last-scan');
        
        if (cachedGames && cachedGames.length > 0 && cachedTime && !options.forceRefresh) {
          const lastScan = new Date(cachedTime);
          const now = new Date();
          const timeDiff = now.getTime() - lastScan.getTime();
          
          // Use cache if it's less than 1 hour old
          if (timeDiff < 60 * 60 * 1000) {
            return { platform: Platform.Steam, games: cachedGames };
          }
        }
      }

      // Web environment - return empty array
      if (typeof window !== 'undefined' && !window.electronAPI) {
        console.log('Web environment detected, returning empty array for Steam games');
        return { platform: Platform.Steam, games: [] };
      }

      // Electron environment - use real detection
      const games = await detectSteamGames();
      
      // Cache results
      if (options.useCache !== false) {
        await setItem('steam-games', games);
        await setItem('steam-last-scan', new Date().toISOString());
      }
      
      return { platform: Platform.Steam, games };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error detecting Steam games';
      setError(errorMessage);
      console.error('Error detecting Steam games:', err);
      return { platform: Platform.Steam, games: [], error: errorMessage };
    } finally {
      setIsDetecting(false);
    }
  }, [isDetecting, getItem, setItem]);

  return {
    detect,
    isDetecting,
    error
  };
}

// Real implementation for Steam games detection
async function detectSteamGames(): Promise<GameInfo[]> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  const games: GameInfo[] = [];
  const { fs, registry, Registry } = window.electronAPI;
  const homedir = (await window.electronAPI.fs.getSystemPaths()).home;

  try {
    // Find Steam installation path from registry
    let steamPath = "";
    
    if (window.electronAPI.system.platform === "win32") {
      try {
        steamPath = await registry.getValue(
          Registry.HKEY.CURRENT_USER,
          "SOFTWARE\\Valve\\Steam",
          "SteamPath"
        );
      } catch (error) {
        console.warn("Could not read Steam path from CURRENT_USER registry:", error);
      }
      
      // If not found in CURRENT_USER, try LOCAL_MACHINE
      if (!steamPath) {
        try {
          steamPath = await registry.getValue(
            Registry.HKEY.LOCAL_MACHINE,
            "SOFTWARE\\WOW6432Node\\Valve\\Steam",
            "InstallPath"
          );
        } catch (error) {
          console.warn("Could not read Steam path from LOCAL_MACHINE registry:", error);
        }
      }
    }

    // Default paths for different platforms
    if (!steamPath) {
      const defaultPaths: Record<string, string[]> = {
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
      
      const platformPaths = defaultPaths[window.electronAPI.system.platform as keyof typeof defaultPaths] || [];
      
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
    
    // Find Steam libraries
    const libraries = [steamPath];
    
    // Read libraryfolders.vdf to find more libraries
    try {
      // Possible paths for libraryfolders.vdf
      const libraryFoldersPaths = [
        path.join(steamPath, "steamapps", "libraryfolders.vdf"), // Newer path
        path.join(steamPath, "config", "libraryfolders.vdf"), // Older path
      ];
      
      let libraryFoldersContent = "";
      
      for (const libPath of libraryFoldersPaths) {
        if (await fs.exists(libPath)) {
          libraryFoldersContent = await fs.readFile(libPath);
          break;
        }
      }
      
      if (libraryFoldersContent) {
        // Extract library paths
        const pathRegex = /"path"\s+"([^"]+)"/g;
        const matches = Array.from(libraryFoldersContent.matchAll(pathRegex));
        
        for (const match of matches) {
          libraries.push(match[1].replace(/\\\\/g, "\\"));
        }
        
        // If no matches found, try alternative format
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
    for (const library of libraries) {
      const appsDir = path.join(library, "steamapps");
      
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
            
            // Extract information from manifest
            const appIdMatch = /"appid"\s+"(\d+)"/.exec(manifestContent);
            const nameMatch = /"name"\s+"([^"]+)"/.exec(manifestContent);
            const installDirMatch = /"installdir"\s+"([^"]+)"/.exec(manifestContent);
            const sizeOnDiskMatch = /"SizeOnDisk"\s+"(\d+)"/.exec(manifestContent);
            const lastPlayedMatch = /"LastPlayed"\s+"(\d+)"/.exec(manifestContent);
            
            if (appIdMatch && nameMatch && installDirMatch) {
              const appId = appIdMatch[1];
              const name = nameMatch[1];
              const installDir = installDirMatch[1];
              
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
                    // Prefer executable with the same name as the installation directory
                    const mainExe = exeFiles.find(file => 
                      file.name.toLowerCase() === `${installDir.toLowerCase()}.exe`
                    ) || exeFiles[0];
                    
                    executablePath = mainExe.path;
                    processName = mainExe.name;
                  }
                } catch (error) {
                  console.log(`Could not scan executables for ${name}:`, error);
                }
              }
              
              // Steam icon URL
              const iconUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
              
              games.push({
                id: `steam-${appId}`,
                name,
                platform: Platform.Steam,
                installPath,
                executablePath,
                process_name: processName,
                size: sizeInMB,
                icon_url: iconUrl,
                last_played: lastPlayed
              });
              
              console.log(`Found Steam game: ${name} (${appId})`);
            }
          } catch (error) {
            console.error(`Error processing Steam manifest ${manifestFile.name}:`, error);
          }
        }
      }
    }

    return games;
  } catch (error) {
    console.error("Error scanning Steam games:", error);
    return [];
  }
}