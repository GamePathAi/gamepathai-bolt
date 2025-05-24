import { useState, useCallback } from 'react';
import type { GameInfo, DetectionResult, DetectorOptions } from '../../lib/gameDetection/types';
import { Platform } from '../../lib/gameDetection/types';
import { useLocalStorage } from '../useLocalStorage';
import path from 'path-browserify';

export function useUplayDetector() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getItem, setItem } = useLocalStorage();

  const detect = useCallback(async (options: DetectorOptions = {}): Promise<DetectionResult> => {
    if (isDetecting) {
      return { platform: Platform.Ubisoft, games: [], error: 'Detection already in progress' };
    }

    setIsDetecting(true);
    setError(null);

    try {
      // Check if we should use cache
      if (options.useCache !== false) {
        const cachedGames = await getItem<GameInfo[]>('uplay-games');
        const cachedTime = await getItem<string>('uplay-last-scan');
        
        if (cachedGames && cachedGames.length > 0 && cachedTime && !options.forceRefresh) {
          const lastScan = new Date(cachedTime);
          const now = new Date();
          const timeDiff = now.getTime() - lastScan.getTime();
          
          // Use cache if it's less than 1 hour old
          if (timeDiff < 60 * 60 * 1000) {
            return { platform: Platform.Ubisoft, games: cachedGames };
          }
        }
      }

      // Web environment - use mock data
      if (typeof window !== 'undefined' && !window.electronAPI) {
        const games = await detectUplayGamesMock();
        
        // Cache results
        if (options.useCache !== false) {
          await setItem('uplay-games', games);
          await setItem('uplay-last-scan', new Date().toISOString());
        }
        
        return { platform: Platform.Ubisoft, games };
      }

      // Electron environment - use real detection
      const games = await detectUplayGames();
      
      // Cache results
      if (options.useCache !== false) {
        await setItem('uplay-games', games);
        await setItem('uplay-last-scan', new Date().toISOString());
      }
      
      return { platform: Platform.Ubisoft, games };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error detecting Ubisoft Connect games';
      setError(errorMessage);
      console.error('Error detecting Ubisoft Connect games:', err);
      return { platform: Platform.Ubisoft, games: [], error: errorMessage };
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

// Real implementation for Ubisoft Connect games detection
async function detectUplayGames(): Promise<GameInfo[]> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  const games: GameInfo[] = [];
  const { fs, registry, Registry } = window.electronAPI;

  try {
    // Only supported on Windows
    if (window.electronAPI.system.platform !== "win32") {
      console.log("Ubisoft Connect scanning is only supported on Windows");
      return [];
    }

    // Find Ubisoft Connect installation path from registry
    let uplayPath = await registry.getValue(
      Registry.HKEY.LOCAL_MACHINE,
      "SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher",
      "InstallDir"
    );
    
    if (!uplayPath) {
      uplayPath = await registry.getValue(
        Registry.HKEY.LOCAL_MACHINE,
        "SOFTWARE\\Ubisoft\\Launcher",
        "InstallDir"
      );
    }

    // Default paths to check if registry fails
    const defaultPaths = [
      "C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher",
      "C:\\Program Files\\Ubisoft\\Ubisoft Game Launcher",
      "C:\\Program Files (x86)\\Ubisoft\\Ubisoft Connect",
      "C:\\Program Files\\Ubisoft\\Ubisoft Connect"
    ];
    
    if (!uplayPath) {
      for (const defaultPath of defaultPaths) {
        if (await fs.exists(defaultPath)) {
          uplayPath = defaultPath;
          break;
        }
      }
    }

    if (!uplayPath) {
      console.log("Ubisoft Connect installation not found");
      return [];
    }

    console.log(`Ubisoft Connect installation found at: ${uplayPath}`);
    
    // Possible game locations
    const gamePaths = [
      path.join(uplayPath, "games"),
      "C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games",
      "C:\\Program Files\\Ubisoft\\Ubisoft Game Launcher\\games",
      "C:\\Program Files (x86)\\Ubisoft\\Ubisoft Connect\\games",
      "C:\\Program Files\\Ubisoft\\Ubisoft Connect\\games"
    ];
    
    // Try to find additional paths from registry
    try {
      const installsPath = await registry.getValue(
        Registry.HKEY.LOCAL_MACHINE,
        "SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher",
        "InstallsPath"
      );
      
      if (installsPath && !gamePaths.includes(installsPath)) {
        gamePaths.push(installsPath);
      }
    } catch (error) {
      console.warn("Could not read Ubisoft installs path from registry:", error);
    }

    // Scan each possible path
    for (const gamePath of gamePaths) {
      if (await fs.exists(gamePath)) {
        console.log(`Scanning Ubisoft Connect games in: ${gamePath}`);
        
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
                !path.basename(exe).toLowerCase().includes('upc') &&
                !path.basename(exe).toLowerCase().includes('uplay') &&
                !path.basename(exe).toLowerCase().includes('ubisoft') &&
                !path.basename(exe).toLowerCase().includes('launcher') &&
                !path.basename(exe).toLowerCase().includes('setup') &&
                !path.basename(exe).toLowerCase().includes('unins')
              );
              
              if (gameExecutables.length > 0) {
                executablePath = gameExecutables[0];
                processName = path.basename(executablePath);
              }
            } catch (error) {
              console.warn(`Could not scan executables for Ubisoft game ${entry.name}:`, error);
            }
            
            // Calculate size
            let sizeInMB = 0;
            try {
              const stats = await fs.stat(gameDir);
              sizeInMB = Math.round(stats.size / (1024 * 1024));
            } catch (error) {
              console.warn(`Could not determine size for Ubisoft game ${entry.name}:`, error);
            }
            
            if (executablePath) {
              // Format game name
              const gameName = entry.name
                .replace(/([A-Z])/g, ' $1') // Add spaces before capital letters
                .replace(/_/g, ' ') // Replace underscores with spaces
                .trim();
              
              games.push({
                id: `uplay-${Buffer.from(gameDir).toString('base64')}`,
                name: gameName,
                platform: Platform.Ubisoft,
                installPath: gameDir,
                executablePath,
                process_name: processName,
                size: sizeInMB
              });
              
              console.log(`Found Ubisoft Connect game: ${gameName}`);
            }
          }
        }
      }
    }

    return games;
  } catch (error) {
    console.error("Error scanning Ubisoft Connect games:", error);
    return [];
  }
}

// Mock implementation for Ubisoft Connect games detection
async function detectUplayGamesMock(): Promise<GameInfo[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: 'uplay-assassins-creed-valhalla',
      name: 'Assassin\'s Creed Valhalla',
      platform: Platform.Ubisoft,
      installPath: 'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games\\Assassin\'s Creed Valhalla',
      executablePath: 'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games\\Assassin\'s Creed Valhalla\\ACValhalla.exe',
      process_name: 'ACValhalla.exe',
      icon_url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/449BBgnQKEMXlgaHzO3gZZ/7f8c3bdc5ebc5088e0e3f35c309c5a9c/acv-boxshot.jpg',
      size: 70 * 1024,
      last_played: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      optimized: true
    },
    {
      id: 'uplay-rainbow-six-siege',
      name: 'Tom Clancy\'s Rainbow Six Siege',
      platform: Platform.Ubisoft,
      installPath: 'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games\\Rainbow Six Siege',
      executablePath: 'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games\\Rainbow Six Siege\\RainbowSix.exe',
      process_name: 'RainbowSix.exe',
      icon_url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/7qSZbSIiI3i2xM9vlnHSS0/5713b53a56a3ef7b0aacb03655c3c9c7/r6s-boxshot.jpg',
      size: 65 * 1024,
      last_played: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      optimized: true
    },
    {
      id: 'uplay-far-cry-6',
      name: 'Far Cry 6',
      platform: Platform.Ubisoft,
      installPath: 'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games\\Far Cry 6',
      executablePath: 'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games\\Far Cry 6\\bin\\FarCry6.exe',
      process_name: 'FarCry6.exe',
      icon_url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/5KNU8QzLQTJJyCMoLXZzxn/f2e82b8aef63b181c76b31b7e35fa2fd/fc6-boxshot.jpg',
      size: 85 * 1024,
      last_played: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      optimized: false
    }
  ];
}