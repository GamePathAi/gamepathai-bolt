import { useState, useCallback } from 'react';
import type { GameInfo, DetectionResult, DetectorOptions } from '../../lib/gameDetection/types';
import { Platform } from '../../lib/gameDetection/types';
import { useLocalStorage } from '../useLocalStorage';
import path from 'path-browserify';

// Function to detect if we're in Electron environment
const isElectron = () => {
  return (
    typeof window !== 'undefined' && 
    window.electronAPI !== undefined
  );
};

export function useBattleNetDetector() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getItem, setItem } = useLocalStorage();

  const detect = useCallback(async (options: DetectorOptions = {}): Promise<DetectionResult> => {
    if (isDetecting) {
      return { platform: Platform.Battle, games: [], error: 'Detection already in progress' };
    }

    setIsDetecting(true);
    setError(null);

    try {
      // Check if we should use cache
      if (options.useCache !== false) {
        const cachedGames = await getItem<GameInfo[]>('battlenet-games');
        const cachedTime = await getItem<string>('battlenet-last-scan');
        
        if (cachedGames && cachedGames.length > 0 && cachedTime && !options.forceRefresh) {
          const lastScan = new Date(cachedTime);
          const now = new Date();
          const timeDiff = now.getTime() - lastScan.getTime();
          
          // Use cache if it's less than 1 hour old
          if (timeDiff < 60 * 60 * 1000) {
            return { platform: Platform.Battle, games: cachedGames };
          }
        }
      }

      // Check if we're in Electron environment
      if (!isElectron()) {
        console.log('Not in Electron environment, using mock data for Battle.net games');
        let games = [];
        if (window.electronAPI?.gameAPI?.detectBattleNetGames) {
          games = await window.electronAPI.gameAPI.detectBattleNetGames();
        }
        return { platform: Platform.Battle, games };
      }

      // Electron environment - use real detection
      console.log('âœ… Electron environment detected, using real detection for Battle.net games');
      const games = await detectBattleNetGames();
      
      // Cache results
      if (options.useCache !== false) {
        await setItem('battlenet-games', games);
        await setItem('battlenet-last-scan', new Date().toISOString());
      }
      
      return { platform: Platform.Battle, games };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error detecting Battle.net games';
      setError(errorMessage);
      console.error('Error detecting Battle.net games:', err);
      return { platform: Platform.Battle, games: [], error: errorMessage };
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

// Real implementation for Battle.net games detection
async function detectBattleNetGames(): Promise<GameInfo[]> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  const games: GameInfo[] = [];
  const { fs, registry, Registry } = window.electronAPI;

  try {
    // Only supported on Windows
    if (!window.electronAPI.system || window.electronAPI.system.platform !== "win32") {
      console.warn("Battle.net scanning is only supported on Windows or system info not available");
      return [];
    }

    // Find Battle.net installation path from registry
    let battleNetPath = "";
    
    try {
      battleNetPath = await registry.getValue(
        Registry.HKEY.LOCAL_MACHINE,
        "SOFTWARE\\WOW6432Node\\Blizzard Entertainment\\Battle.net",
        "InstallPath"
      );
    } catch (error) {
      console.warn("Could not read Battle.net path from WOW6432Node registry:", error);
    }
    
    if (!battleNetPath) {
      try {
        battleNetPath = await registry.getValue(
          Registry.HKEY.LOCAL_MACHINE,
          "SOFTWARE\\Blizzard Entertainment\\Battle.net",
          "InstallPath"
        );
      } catch (error) {
        console.warn("Could not read Battle.net path from registry:", error);
      }
    }

    // Default paths to check if registry fails
    const defaultPaths = [
      "C:\\Program Files (x86)\\Battle.net",
      "C:\\Program Files\\Battle.net"
    ];
    
    if (!battleNetPath) {
      for (const defaultPath of defaultPaths) {
        if (await fs.exists(defaultPath)) {
          battleNetPath = defaultPath;
          break;
        }
      }
    }

    if (!battleNetPath) {
      console.log("Battle.net installation not found");
      return [];
    }

    console.log(`Battle.net installation found at: ${battleNetPath}`);
    
    // Possible game locations
    const gamePaths = [
      path.join(battleNetPath, "Games"),
      "C:\\Program Files (x86)\\Blizzard Entertainment",
      "C:\\Program Files\\Blizzard Entertainment"
    ];

    // Known Battle.net games
    const knownGames = {
      "Overwatch": {
        name: "Overwatch 2",
        process: "Overwatch.exe",
        icon: "https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt0c8f82b1d7a78e4e/622906a991f4232f0085d3cc/Masthead_Overwatch2_Logo.png"
      },
      "World of Warcraft": {
        name: "World of Warcraft",
        process: "Wow.exe",
        icon: "https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/bltd6b49a2d33e715e1/62f5dcd2c1d5855da1673a4e/WoW_Masthead_Logo.png"
      },
      "Diablo III": {
        name: "Diablo III",
        process: "Diablo III.exe",
        icon: "https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/bltc209ebc106231822/6165ee2c0f19b5111d77c273/D3_Masthead_Logo.png"
      },
      "Diablo IV": {
        name: "Diablo IV",
        process: "Diablo IV.exe",
        icon: "https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt7c7f5dec2a3fd536/63c5c7f3a8b0b4111ff3fe7c/Diablo_Masthead_Logo.png"
      },
      "Hearthstone": {
        name: "Hearthstone",
        process: "Hearthstone.exe",
        icon: "https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt499f79e3aa1a3b97/62f5dcd2c1d5855da1673a4e/HS_Masthead_Logo.png"
      },
      "StarCraft II": {
        name: "StarCraft II",
        process: "SC2.exe",
        icon: "https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/bltf0f1d06b6f24a8a1/62f5dcd2c1d5855da1673a4e/SC2_Masthead_Logo.png"
      },
      "Call of Duty": {
        name: "Call of Duty",
        process: "BlackOpsColdWar.exe",
        icon: "https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt0b41c9f1f5d9c542/62f5dcd2c1d5855da1673a4e/COD_Masthead_Logo.png"
      }
    };

    // Scan each possible path
    for (const gamePath of gamePaths) {
      if (await fs.exists(gamePath)) {
        console.log(`Scanning Battle.net games in: ${gamePath}`);
        
        const entries = await fs.readDir(gamePath);
        
        for (const entry of entries) {
          if (entry.isDirectory) {
            const gameDir = entry.path;
            
            // Check if it's a known game
            const knownGameEntry = Object.entries(knownGames).find(([key]) => 
              entry.name.includes(key)
            );
            
            if (knownGameEntry) {
              const [key, gameInfo] = knownGameEntry;
              
              // Look for the executable
              let executablePath = "";
              try {
                const files = await fs.readDir(gameDir);
                const exeFiles = files.filter(file => file.name.endsWith('.exe'));
                
                // Look for the known executable
                const mainExe = exeFiles.find(file => file.name === gameInfo.process);
                
                if (mainExe) {
                  executablePath = mainExe.path;
                }
              } catch (error) {
                console.warn(`Could not scan executables for Battle.net game ${gameInfo.name}:`, error);
              }
              
              // Calculate size
              let sizeInMB = 0;
              try {
                const stats = await fs.stat(gameDir);
                sizeInMB = Math.round(stats.size / (1024 * 1024));
              } catch (error) {
                console.warn(`Could not determine size for Battle.net game ${gameInfo.name}:`, error);
              }
              
              if (executablePath) {
                games.push({
                  id: `battlenet-${key.replace(/\s+/g, '').toLowerCase()}`,
                  name: gameInfo.name,
                  platform: Platform.Battle,
                  installPath: gameDir,
                  executablePath,
                  process_name: gameInfo.process,
                  size: sizeInMB,
                  icon_url: gameInfo.icon
                });
                
                console.log(`Found Battle.net game: ${gameInfo.name}`);
              }
            }
          }
        }
      }
    }

    return games;
  } catch (error) {
    console.error("Error scanning Battle.net games:", error);
    return [];
  }

  // ... (Aqui poderia entrar a lógica manual antiga, se necessário)
  // Para simplificação, retorna array vazio se não conseguir usar o gameAPI
  return [];
}