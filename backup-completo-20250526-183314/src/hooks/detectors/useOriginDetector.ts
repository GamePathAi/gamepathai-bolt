import { useState, useCallback } from 'react';
import type { GameInfo, DetectionResult, DetectorOptions } from '../../lib/gameDetection/types';
import { Platform } from '../../lib/gameDetection/types';
import { useLocalStorage } from '../useLocalStorage';
import path from 'path-browserify';
import { mockGetOriginGames } from '../../lib/gameDetection/platforms/mockPlatforms';

// Function to detect if we're in Electron environment
const isElectron = () => {
  return (
    typeof window !== 'undefined' && 
    window.electronAPI !== undefined
  );
};

export function useOriginDetector() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getItem, setItem } = useLocalStorage();

  const detect = useCallback(async (options: DetectorOptions = {}): Promise<DetectionResult> => {
    if (isDetecting) {
      return { platform: Platform.Origin, games: [], error: 'Detection already in progress' };
    }

    setIsDetecting(true);
    setError(null);

    try {
      // Check if we should use cache
      if (options.useCache !== false) {
        const cachedGames = await getItem<GameInfo[]>('origin-games');
        const cachedTime = await getItem<string>('origin-last-scan');
        
        if (cachedGames && cachedGames.length > 0 && cachedTime && !options.forceRefresh) {
          const lastScan = new Date(cachedTime);
          const now = new Date();
          const timeDiff = now.getTime() - lastScan.getTime();
          
          // Use cache if it's less than 1 hour old
          if (timeDiff < 60 * 60 * 1000) {
            return { platform: Platform.Origin, games: cachedGames };
          }
        }
      }

      // Check if we're in Electron environment
      if (!isElectron()) {
        console.log('Not in Electron environment, using mock data for Origin games');
        const mockGames = await mockGetOriginGames();
        return { platform: Platform.Origin, games: mockGames };
      }

      // Electron environment - use real detection
      console.log('✅ Electron environment detected, using real detection for Origin games');
      const games = await detectOriginGames();
      
      // Cache results
      if (options.useCache !== false) {
        await setItem('origin-games', games);
        await setItem('origin-last-scan', new Date().toISOString());
      }
      
      return { platform: Platform.Origin, games };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error detecting Origin games';
      setError(errorMessage);
      console.error('Error detecting Origin games:', err);
      return { platform: Platform.Origin, games: [], error: errorMessage };
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

// Real implementation for Origin games detection
async function detectOriginGames(): Promise<GameInfo[]> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  const games: GameInfo[] = [];
  const { fs, registry, Registry } = window.electronAPI;
  const homedir = (await window.electronAPI.fs.getSystemPaths()).home;

  try {
    // Only supported on Windows
    if (window.electronAPI.system.platform !== "win32") {
      console.log("Origin/EA Desktop scanning is only supported on Windows");
      return [];
    }

    // Find Origin installation path from registry
    let originPath = "";
    
    try {
      originPath = await registry.getValue(
        Registry.HKEY.LOCAL_MACHINE,
        "SOFTWARE\\WOW6432Node\\Origin",
        "InstallDir"
      );
    } catch (error) {
      console.warn("Could not read Origin path from WOW6432Node registry:", error);
    }
    
    if (!originPath) {
      try {
        originPath = await registry.getValue(
          Registry.HKEY.LOCAL_MACHINE,
          "SOFTWARE\\Origin",
          "InstallDir"
        );
      } catch (error) {
        console.warn("Could not read Origin path from registry:", error);
      }
    }

    // Find EA Desktop installation path
    let eaDesktopPath = "";
    
    try {
      eaDesktopPath = await registry.getValue(
        Registry.HKEY.LOCAL_MACHINE,
        "SOFTWARE\\WOW6432Node\\Electronic Arts\\EA Desktop",
        "InstallDir"
      );
    } catch (error) {
      console.warn("Could not read EA Desktop path from registry:", error);
    }

    // Default paths to check if registry fails
    const defaultOriginPaths = [
      "C:\\Program Files (x86)\\Origin",
      "C:\\Program Files\\Origin"
    ];
    
    const defaultEADesktopPaths = [
      "C:\\Program Files\\Electronic Arts\\EA Desktop",
      "C:\\Program Files (x86)\\Electronic Arts\\EA Desktop"
    ];
    
    if (!originPath) {
      for (const defaultPath of defaultOriginPaths) {
        if (await fs.exists(defaultPath)) {
          originPath = defaultPath;
          break;
        }
      }
    }
    
    if (!eaDesktopPath) {
      for (const defaultPath of defaultEADesktopPaths) {
        if (await fs.exists(defaultPath)) {
          eaDesktopPath = defaultPath;
          break;
        }
      }
    }

    if (!originPath && !eaDesktopPath) {
      console.log("Origin/EA Desktop installation not found");
      return [];
    }

    // Find game directories
    let gamesPaths: string[] = [];
    
    // Origin
    if (originPath) {
      console.log(`Origin installation found at: ${originPath}`);
      
      // Try to find games path from registry
      try {
        const originGamesPath = await registry.getValue(
          Registry.HKEY.LOCAL_MACHINE,
          "SOFTWARE\\WOW6432Node\\Origin",
          "GamesPath"
        );
        
        if (originGamesPath) {
          gamesPaths.push(originGamesPath);
        }
      } catch (error) {
        console.warn("Could not read Origin games path from registry:", error);
      }
      
      // Default paths for Origin games
      const defaultOriginGamesPaths = [
        "C:\\Program Files (x86)\\Origin Games",
        "C:\\Program Files\\Origin Games",
        path.join(homedir, "Origin Games")
      ];
      
      for (const defaultPath of defaultOriginGamesPaths) {
        if (await fs.exists(defaultPath)) {
          if (!gamesPaths.includes(defaultPath)) {
            gamesPaths.push(defaultPath);
          }
        }
      }
    }
    
    // EA Desktop
    if (eaDesktopPath) {
      console.log(`EA Desktop installation found at: ${eaDesktopPath}`);
      
      // Check Local Content for games
      const envVars = await window.electronAPI.fs.getEnvVars();
      const localAppData = envVars.LOCALAPPDATA || path.join(envVars.USERPROFILE, "AppData", "Local");
      const eaContentPath = path.join(
        localAppData,
        "Electronic Arts",
        "EA Desktop",
        "LocalContent"
      );
      
      if (await fs.exists(eaContentPath)) {
        if (!gamesPaths.includes(eaContentPath)) {
          gamesPaths.push(eaContentPath);
        }
      }
    }

    if (gamesPaths.length === 0) {
      console.log("No Origin/EA Desktop games paths found");
      return [];
    }

    console.log(`Found ${gamesPaths.length} Origin/EA games paths: ${gamesPaths.join(", ")}`);
    
    // Scan each game directory
    for (const gamesPath of gamesPaths) {
      const entries = await fs.readDir(gamesPath);
      
      for (const entry of entries) {
        if (entry.isDirectory) {
          try {
            const gamePath = entry.path;
            const name = entry.name;
            
            // Try to find executables
            let executablePath = "";
            let processName = "";
            
            try {
              const gameFiles = await fs.readDir(gamePath);
              const exeFiles = gameFiles.filter(file => file.name.toLowerCase().endsWith(".exe"));
              
              if (exeFiles.length > 0) {
                // Prefer executable with the same name as the directory
                const mainExe = exeFiles.find(file => 
                  file.name.toLowerCase().includes(name.toLowerCase()) 
                ) || exeFiles[0];
                
                executablePath = mainExe.path;
                processName = mainExe.name;
              }
            } catch (error) {
              console.warn(`Could not scan executables for Origin game ${name}:`, error);
            }
            
            // Calculate size
            let sizeInMB = 0;
            try {
              const stats = await fs.stat(gamePath);
              sizeInMB = Math.round(stats.size / (1024 * 1024));
            } catch (error) {
              console.warn(`Could not determine size for Origin game ${name}:`, error);
            }
            
            if (executablePath) {
              games.push({
                id: `origin-${name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`,
                name,
                platform: Platform.Origin,
                installPath: gamePath,
                executablePath,
                process_name: processName,
                size: sizeInMB
              });
              
              console.log(`Found Origin game: ${name}`);
            }
          } catch (error) {
            console.error(`Error processing Origin game directory ${entry.name}:`, error);
          }
        }
      }
    }

    return games;
  } catch (error) {
    console.error("Error scanning Origin games:", error);
    return [];
  }
}