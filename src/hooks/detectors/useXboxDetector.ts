import { useState, useCallback } from 'react';
import type { GameInfo, DetectionResult, DetectorOptions } from '../../lib/gameDetection/types';
import { Platform } from '../../lib/gameDetection/types';
import { useLocalStorage } from '../useLocalStorage';
import path from 'path-browserify';

export function useXboxDetector() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getItem, setItem } = useLocalStorage();

  const detect = useCallback(async (options: DetectorOptions = {}): Promise<DetectionResult> => {
    if (isDetecting) {
      return { platform: Platform.Xbox, games: [], error: 'Detection already in progress' };
    }

    setIsDetecting(true);
    setError(null);

    try {
      // Check if we should use cache
      if (options.useCache !== false) {
        const cachedGames = await getItem<GameInfo[]>('xbox-games');
        const cachedTime = await getItem<string>('xbox-last-scan');
        
        if (cachedGames && cachedGames.length > 0 && cachedTime && !options.forceRefresh) {
          const lastScan = new Date(cachedTime);
          const now = new Date();
          const timeDiff = now.getTime() - lastScan.getTime();
          
          // Use cache if it's less than 1 hour old
          if (timeDiff < 60 * 60 * 1000) {
            return { platform: Platform.Xbox, games: cachedGames };
          }
        }
      }

      // Web environment - use mock data
      if (typeof window !== 'undefined' && !window.electronAPI) {
        const games = await detectXboxGamesMock();
        
        // Cache results
        if (options.useCache !== false) {
          await setItem('xbox-games', games);
          await setItem('xbox-last-scan', new Date().toISOString());
        }
        
        return { platform: Platform.Xbox, games };
      }

      // Electron environment - use real detection
      const games = await detectXboxGames();
      
      // Cache results
      if (options.useCache !== false) {
        await setItem('xbox-games', games);
        await setItem('xbox-last-scan', new Date().toISOString());
      }
      
      return { platform: Platform.Xbox, games };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error detecting Xbox games';
      setError(errorMessage);
      console.error('Error detecting Xbox games:', err);
      return { platform: Platform.Xbox, games: [], error: errorMessage };
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

// Real implementation for Xbox games detection
async function detectXboxGames(): Promise<GameInfo[]> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  const games: GameInfo[] = [];
  const { fs, registry, Registry } = window.electronAPI;

  try {
    // Only supported on Windows
    if (window.electronAPI.system.platform !== "win32") {
      console.log("Xbox Games scanning is only supported on Windows");
      return [];
    }

    // Possible installation locations for Xbox games
    const possiblePaths = [
      "C:\\XboxGames",
      "D:\\XboxGames",
      "E:\\XboxGames",
      "C:\\Program Files\\WindowsApps",
      "C:\\Program Files\\ModifiableWindowsApps"
    ];
    
    // Try to find additional paths from registry
    try {
      const xboxPath = await registry.getValue(
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

    // Scan each possible path
    for (const basePath of possiblePaths) {
      if (await fs.exists(basePath)) {
        console.log(`Scanning Xbox games in: ${basePath}`);
        
        const entries = await fs.readDir(basePath);
        
        for (const entry of entries) {
          if (entry.isDirectory) {
            const gamePath = entry.path;
            
            // Check if it's an Xbox game directory
            const isXboxGame = entry.name.startsWith("Microsoft.") || 
                              gamePath.includes("XboxGames") ||
                              await containsGameFiles(fs, gamePath);
            
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
            
            // Try to find the main executable
            let executablePath = "";
            let processName = "";
            
            try {
              const gameFiles = await findExecutablesRecursively(fs, gamePath);
              
              // Filter for executables that are likely games
              const gameExecutables = gameFiles.filter(exe => 
                !path.basename(exe).toLowerCase().includes("setup") &&
                !path.basename(exe).toLowerCase().includes("unins") &&
                !path.basename(exe).toLowerCase().includes("crash") &&
                !path.basename(exe).toLowerCase().includes("launcher")
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
              sizeInMB = Math.round(stats.size / (1024 * 1024));
            } catch (error) {
              console.warn(`Could not determine size for Xbox game ${gameName}:`, error);
            }
            
            // Add game to list
            if (executablePath) {
              games.push({
                id: `xbox-${entry.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`,
                name: gameName,
                platform: Platform.Xbox,
                installPath: gamePath,
                executablePath,
                process_name: processName,
                size: sizeInMB
              });
              
              console.log(`Found Xbox game: ${gameName}`);
            }
          }
        }
      }
    }

    return games;
  } catch (error) {
    console.error("Error scanning Xbox games:", error);
    return [];
  }
}

// Helper function to check if a directory contains game files
async function containsGameFiles(fs: any, dirPath: string): Promise<boolean> {
  try {
    const files = await fs.readDir(dirPath);
    
    // Check for common game extensions
    const gameExtensions = [".exe", ".dll", ".pak", ".dat", ".bin", ".ini", ".cfg"];
    
    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase();
      if (gameExtensions.includes(ext)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

// Helper function to find executables recursively
async function findExecutablesRecursively(fs: any, dirPath: string, maxDepth = 3): Promise<string[]> {
  if (maxDepth <= 0) return [];
  
  try {
    const entries = await fs.readDir(dirPath);
    let executables: string[] = [];
    
    for (const entry of entries) {
      if (entry.isDirectory) {
        // Recursively search subdirectories
        const subDirExecutables = await findExecutablesRecursively(fs, entry.path, maxDepth - 1);
        executables = executables.concat(subDirExecutables);
      } else if (entry.name.toLowerCase().endsWith(".exe")) {
        executables.push(entry.path);
      }
    }
    
    return executables;
  } catch (error) {
    return [];
  }
}

// Mock implementation for Xbox games detection
async function detectXboxGamesMock(): Promise<GameInfo[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: 'xbox-forza-horizon-5',
      name: 'Forza Horizon 5',
      platform: Platform.Xbox,
      installPath: 'C:\\Program Files\\WindowsApps\\Microsoft.ForzaHorizon5',
      executablePath: 'C:\\Program Files\\WindowsApps\\Microsoft.ForzaHorizon5\\ForzaHorizon5.exe',
      process_name: 'ForzaHorizon5.exe',
      icon_url: 'https://store-images.s-microsoft.com/image/apps.16285.14545862226628914.552c1c1a-6c9f-4a94-a83a-8d3165b95a7c.2a1f8a68-5aad-4a18-a8e7-f3a935f60a7c',
      size: 110 * 1024,
      last_played: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      optimized: true
    },
    {
      id: 'xbox-halo-infinite',
      name: 'Halo Infinite',
      platform: Platform.Xbox,
      installPath: 'C:\\Program Files\\WindowsApps\\Microsoft.HaloInfinite',
      executablePath: 'C:\\Program Files\\WindowsApps\\Microsoft.HaloInfinite\\HaloInfinite.exe',
      process_name: 'HaloInfinite.exe',
      icon_url: 'https://store-images.s-microsoft.com/image/apps.65119.14038107331740138.6a496b44-b8e5-4a5e-a632-db2fea135ae6.be70f297-0d61-4650-b5ac-ef9c4c6d0a2a',
      size: 70 * 1024,
      last_played: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      optimized: false
    },
    {
      id: 'xbox-sea-of-thieves',
      name: 'Sea of Thieves',
      platform: Platform.Xbox,
      installPath: 'C:\\Program Files\\WindowsApps\\Microsoft.SeaofThieves',
      executablePath: 'C:\\Program Files\\WindowsApps\\Microsoft.SeaofThieves\\Athena\\Binaries\\Win64\\AthenaClient.exe',
      process_name: 'AthenaClient.exe',
      icon_url: 'https://store-images.s-microsoft.com/image/apps.64156.14154249287303114.f5c1ce97-0d91-4e2f-a4f9-81d9c5c4c4c4.6e367dbe-c3c6-4a3a-b7a0-2a60d585a0e5',
      size: 50 * 1024,
      last_played: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      optimized: true
    }
  ];
}