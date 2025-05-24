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

      // Web environment - use mock data
      if (typeof window !== 'undefined' && !window.electronAPI) {
        const games = await detectGOGGamesMock();
        
        // Cache results
        if (options.useCache !== false) {
          await setItem('gog-games', games);
          await setItem('gog-last-scan', new Date().toISOString());
        }
        
        return { platform: Platform.GOG, games };
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
    // Find GOG Galaxy installation path from registry
    let gogPath = await registry.getValue(
      Registry.HKEY.LOCAL_MACHINE,
      "SOFTWARE\\WOW6432Node\\GOG.com\\GalaxyClient",
      "InstallPath"
    );
    
    if (!gogPath) {
      gogPath = await registry.getValue(
        Registry.HKEY.LOCAL_MACHINE,
        "SOFTWARE\\GOG.com\\GalaxyClient",
        "InstallPath"
      );
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
                !exe.toLowerCase().includes('unins') &&
                !exe.toLowerCase().includes('setup') &&
                !exe.toLowerCase().includes('launcher') &&
                !exe.toLowerCase().includes('config')
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

// Mock implementation for GOG games detection
async function detectGOGGamesMock(): Promise<GameInfo[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: 'gog-witcher3',
      name: 'The Witcher 3: Wild Hunt',
      platform: Platform.GOG,
      installPath: 'C:\\GOG Games\\The Witcher 3 Wild Hunt',
      executablePath: 'C:\\GOG Games\\The Witcher 3 Wild Hunt\\bin\\x64\\witcher3.exe',
      process_name: 'witcher3.exe',
      icon_url: 'https://images.gog-statics.com/d7c3b13c2b0b8c83e8962df2d002a0df7c2b9295d482a4d3ffb4c954e2118d87_product_card_v2_mobile_slider_639.jpg',
      size: 50 * 1024,
      last_played: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      optimized: true
    },
    {
      id: 'gog-cyberpunk2077',
      name: 'Cyberpunk 2077',
      platform: Platform.GOG,
      installPath: 'C:\\GOG Games\\Cyberpunk 2077',
      executablePath: 'C:\\GOG Games\\Cyberpunk 2077\\bin\\x64\\Cyberpunk2077.exe',
      process_name: 'Cyberpunk2077.exe',
      icon_url: 'https://images.gog-statics.com/c75e674590b8947542c809924df30bbef2190341163dd08668e243c266be70c5_product_card_v2_mobile_slider_639.jpg',
      size: 102 * 1024,
      last_played: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      optimized: false
    },
    {
      id: 'gog-disco-elysium',
      name: 'Disco Elysium',
      platform: Platform.GOG,
      installPath: 'C:\\GOG Games\\Disco Elysium',
      executablePath: 'C:\\GOG Games\\Disco Elysium\\disco.exe',
      process_name: 'disco.exe',
      icon_url: 'https://images.gog-statics.com/9d4947e0ad5c4c4dce2b0e9edd4747bb88ad30782afdfe3c6e0ea293bfcf403d_product_card_v2_mobile_slider_639.jpg',
      size: 15 * 1024,
      last_played: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      optimized: false
    }
  ];
}