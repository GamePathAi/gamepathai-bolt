import { useState, useCallback } from 'react';
import type { GameInfo, DetectionResult, DetectorOptions } from '../../lib/gameDetection/types';
import { Platform } from '../../lib/gameDetection/types';
import { useLocalStorage } from '../useLocalStorage';
import path from 'path-browserify';

export function useGOGDetector() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getItem, setItem } = useLocalStorage();

  const detect = useCallback(async (options: DetectorOptions = {}): Promise<DetectionResult> => {
    if (isDetecting) {
      return { platform: Platform.GOG, games: [], error: 'Detection already in progress' };
    }

    setIsDetecting(true);
    setError(null);

    try {
      // Check if we should use cache
      if (options.useCache !== false) {
        const cachedGames = await getItem<GameInfo[]>('gog-games');
        const cachedTime = await getItem<string>('gog-last-scan');
        
        if (cachedGames && cachedGames.length > 0 && cachedTime && !options.forceRefresh) {
          const lastScan = new Date(cachedTime);
          const now = new Date();
          const timeDiff = now.getTime() - lastScan.getTime();
          
          // Use cache if it's less than 1 hour old
          if (timeDiff < 60 * 60 * 1000) {
            return { platform: Platform.GOG, games: cachedGames };
          }
        }
      }

      // Web environment - return empty array
      if (typeof window !== 'undefined' && !window.electronAPI) {
        console.log('Web environment detected, returning empty array for GOG games');
        return { platform: Platform.GOG, games: [] };
      }

      // Electron environment - use real detection
      const games = await detectGOGGames();
      
      // Cache results
      if (options.useCache !== false) {
        await setItem('gog-games', games);
        await setItem('gog-last-scan', new Date().toISOString());
      }
      
      return { platform: Platform.GOG, games };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error detecting GOG games';
      setError(errorMessage);
      console.error('Error detecting GOG games:', err);
      return { platform: Platform.GOG, games: [], error: errorMessage };
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

// Real implementation for GOG games detection
async function detectGOGGames(): Promise<GameInfo[]> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  const games: GameInfo[] = [];
  const { fs, registry, Registry } = window.electronAPI;
  const homedir = (await window.electronAPI.fs.getSystemPaths()).home;

  try {
    // Only supported on Windows
    if (window.electronAPI.system.platform !== "win32") {
      console.log("GOG Galaxy scanning is only supported on Windows");
      return [];
    }

    // Find GOG Galaxy installation path from registry
    let gogPath = "";
    
    try {
      gogPath = await registry.getValue(
        Registry.HKEY.LOCAL_MACHINE,
        "SOFTWARE\\WOW6432Node\\GOG.com\\GalaxyClient",
        "InstallPath"
      );
    } catch (error) {
      console.warn("Could not read GOG path from WOW6432Node registry:", error);
    }
    
    if (!gogPath) {
      try {
        gogPath = await registry.getValue(
          Registry.HKEY.LOCAL_MACHINE,
          "SOFTWARE\\GOG.com\\GalaxyClient",
          "InstallPath"
        );
      } catch (error) {
        console.warn("Could not read GOG path from registry:", error);
      }
    }

    // Default paths to check if registry fails
    const defaultPaths = [
      "C:\\Program Files (x86)\\GOG Galaxy",
      "C:\\Program Files\\GOG Galaxy"
    ];
    
    if (!gogPath) {
      for (const defaultPath of defaultPaths) {
        if (await fs.exists(defaultPath)) {
          gogPath = defaultPath;
          break;
        }
      }
    }

    if (!gogPath) {
      console.log("GOG Galaxy installation not found");
      return [];
    }

    console.log(`GOG Galaxy installation found at: ${gogPath}`);
    
    // Possible game locations
    const gamePaths = [
      path.join(gogPath, "Games"),
      "C:\\GOG Games",
      "D:\\GOG Games",
      path.join(homedir, "GOG Games")
    ];

    // Scan each possible path
    for (const gamePath of gamePaths) {
      if (await fs.exists(gamePath)) {
        console.log(`Scanning GOG games in: ${gamePath}`);
        
        const entries = await fs.readDir(gamePath);
        
        for (const entry of entries) {
          if (entry.isDirectory) {
            const gameDir = entry.path;
            
            // Look for executable
            let executablePath = "";
            let processName = "";
            
            try {
              // Find executables recursively (limited depth)
              const findExecutables = async (dir: string, depth = 0): Promise<string[]> => {
                if (depth > 2) return []; // Limit search depth
                
                const files = await fs.readDir(dir);
                let executables: string[] = [];
                
                for (const file of files) {
                  if (file.isDirectory && depth < 2) {
                    const subDirExecutables = await findExecutables(file.path, depth + 1);
                    executables = executables.concat(subDirExecutables);
                  } else if (file.name.endsWith('.exe')) {
                    executables.push(file.path);
                  }
                }
                
                return executables;
              };
              
              const executables = await findExecutables(gameDir);
              
              // Filter executables that are likely games
              const gameExecutables = executables.filter(exe => 
                !path.basename(exe).toLowerCase().includes('unins') &&
                !path.basename(exe).toLowerCase().includes('setup') &&
                !path.basename(exe).toLowerCase().includes('launcher') &&
                !path.basename(exe).toLowerCase().includes('config')
              );
              
              if (gameExecutables.length > 0) {
                // Prefer executable with the same name as the directory
                const dirName = entry.name.toLowerCase();
                const mainExe = gameExecutables.find(exe => 
                  path.basename(exe).toLowerCase().includes(dirName)
                ) || gameExecutables[0];
                
                executablePath = mainExe;
                processName = path.basename(mainExe);
              }
            } catch (error) {
              console.warn(`Could not scan executables for GOG game ${entry.name}:`, error);
            }
            
            // Calculate size
            let sizeInMB = 0;
            try {
              const stats = await fs.stat(gameDir);
              sizeInMB = Math.round(stats.size / (1024 * 1024));
            } catch (error) {
              console.warn(`Could not determine size for GOG game ${entry.name}:`, error);
            }
            
            if (executablePath) {
              // Format game name
              const gameName = entry.name
                .replace(/^GOG\s+/, '') // Remove "GOG " prefix
                .replace(/\s*\(.*?\)$/, ''); // Remove suffix in parentheses
              
              games.push({
                id: `gog-${Buffer.from(gameDir).toString('base64')}`,
                name: gameName,
                platform: Platform.GOG,
                installPath: gameDir,
                executablePath,
                process_name: processName,
                size: sizeInMB
              });
              
              console.log(`Found GOG game: ${gameName}`);
            }
          }
        }
      }
    }

    return games;
  } catch (error) {
    console.error("Error scanning GOG games:", error);
    return [];
  }
}