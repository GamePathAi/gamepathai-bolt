import { useState, useCallback } from 'react';
import type { GameInfo, DetectionResult, DetectorOptions } from '../../lib/gameDetection/types';
import { Platform } from '../../lib/gameDetection/types';
import { useLocalStorage } from '../useLocalStorage';
import path from 'path-browserify';

export function useEpicDetector() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getItem, setItem } = useLocalStorage();

  const detect = useCallback(async (options: DetectorOptions = {}): Promise<DetectionResult> => {
    if (isDetecting) {
      return { platform: Platform.Epic, games: [], error: 'Detection already in progress' };
    }

    setIsDetecting(true);
    setError(null);

    try {
      // Check if we should use cache
      if (options.useCache !== false) {
        const cachedGames = await getItem<GameInfo[]>('epic-games');
        const cachedTime = await getItem<string>('epic-last-scan');
        
        if (cachedGames && cachedGames.length > 0 && cachedTime && !options.forceRefresh) {
          const lastScan = new Date(cachedTime);
          const now = new Date();
          const timeDiff = now.getTime() - lastScan.getTime();
          
          // Use cache if it's less than 1 hour old
          if (timeDiff < 60 * 60 * 1000) {
            return { platform: Platform.Epic, games: cachedGames };
          }
        }
      }

      // Web environment - use mock data
      if (typeof window !== 'undefined' && !window.electronAPI) {
        const games = await detectEpicGamesMock();
        
        // Cache results
        if (options.useCache !== false) {
          await setItem('epic-games', games);
          await setItem('epic-last-scan', new Date().toISOString());
        }
        
        return { platform: Platform.Epic, games };
      }

      // Electron environment - use real detection
      const games = await detectEpicGames();
      
      // Cache results
      if (options.useCache !== false) {
        await setItem('epic-games', games);
        await setItem('epic-last-scan', new Date().toISOString());
      }
      
      return { platform: Platform.Epic, games };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error detecting Epic games';
      setError(errorMessage);
      console.error('Error detecting Epic games:', err);
      return { platform: Platform.Epic, games: [], error: errorMessage };
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

// Real implementation for Epic games detection
async function detectEpicGames(): Promise<GameInfo[]> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  const games: GameInfo[] = [];
  const { fs, Registry } = window.electronAPI;
  const envVars = await window.electronAPI.fs.getEnvVars();

  try {
    // Find Epic Games Launcher manifest path
    let manifestPath = "";
    
    if (window.electronAPI.system.platform === "win32") {
      const localAppData = envVars.LOCALAPPDATA || path.join(envVars.USERPROFILE, "AppData", "Local");
      manifestPath = path.join(
        localAppData,
        "EpicGamesLauncher",
        "Saved",
        "Config",
        "Windows"
      );
    } else if (window.electronAPI.system.platform === "darwin") {
      const homedir = await window.electronAPI.fs.getSystemPaths().home;
      manifestPath = path.join(
        homedir,
        "Library",
        "Application Support",
        "Epic",
        "EpicGamesLauncher",
        "Config"
      );
    } else {
      const homedir = await window.electronAPI.fs.getSystemPaths().home;
      manifestPath = path.join(
        homedir,
        ".config",
        "Epic",
        "EpicGamesLauncher"
      );
    }
    
    if (!manifestPath) {
      console.log("Epic Games Launcher config path not found");
      return [];
    }
    
    // Check if directory exists
    if (!await fs.exists(manifestPath)) {
      console.log("Epic Games Launcher config directory not found");
      return [];
    }
    
    // Read directory files
    const files = await fs.readDir(manifestPath);
    
    // Find manifest file
    const manifestFiles = [
      "GameInstallation.json",
      "InstallationList.json",
      "LauncherInstalled.dat" // Alternative file
    ];
    
    let manifestContent = "";
    let manifest = null;
    
    for (const manifestFile of manifestFiles) {
      const matchingFile = files.find(file => file.name === manifestFile);
      if (matchingFile) {
        try {
          const fullPath = matchingFile.path;
          manifestContent = await fs.readFile(fullPath);
          
          // Try to parse JSON
          manifest = JSON.parse(manifestContent);
          break;
        } catch (error) {
          console.error(`Error reading Epic manifest ${manifestFile}:`, error);
        }
      }
    }
    
    if (!manifest) {
      console.log("No valid Epic Games installation manifest found");
      return [];
    }
    
    // Extract installed games information
    const installations = manifest.InstallationList || [];
    
    console.log(`Found ${installations.length} Epic games in manifest`);
    
    for (const installation of installations) {
      try {
        if (!installation.InstallLocation) {
          console.log(`Skipping Epic game with no install location: ${installation.DisplayName || "Unknown"}`);
          continue;
        }
        
        const name = installation.DisplayName;
        const appName = installation.AppName;
        const installLocation = installation.InstallLocation;
        const launchExecutable = installation.LaunchExecutable;
        
        // Check if it's actually a game (not an app or tool)
        if (appName && (
          appName.includes("UE_") || 
          appName.includes("Editor") || 
          appName.includes("Launcher") ||
          appName.includes("Tool") ||
          appName.includes("SDK")
        )) {
          console.log(`Skipping Epic non-game application: ${name}`);
          continue;
        }
        
        let executablePath = "";
        if (launchExecutable) {
          executablePath = path.join(installLocation, launchExecutable);
        }
        
        // Calculate game size
        let sizeInMB = 0;
        try {
          const stats = await fs.stat(installLocation);
          sizeInMB = Math.round(stats.size / (1024 * 1024));
        } catch (error) {
          console.warn(`Could not determine size for Epic game ${name}:`, error);
        }
        
        // Try to find an icon for the game
        let iconUrl;
        if (appName) {
          // Use Epic's CDN for icons (approximate format)
          iconUrl = `https://cdn1.epicgames.com/offer/store/item/${appName}/landscape-2560x1440`;
        }
        
        games.push({
          id: `epic-${appName || name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`,
          name,
          platform: Platform.Epic,
          installPath: installLocation,
          executablePath,
          process_name: launchExecutable ? path.basename(launchExecutable) : "",
          size: sizeInMB,
          icon_url: iconUrl
        });
        
        console.log(`Found Epic game: ${name}`);
      } catch (error) {
        console.error(`Error processing Epic game:`, error);
      }
    }
    
    return games;
  } catch (error) {
    console.error("Error scanning Epic games:", error);
    return [];
  }
}

// Mock implementation for Epic games detection
async function detectEpicGamesMock(): Promise<GameInfo[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: 'epic-fortnite',
      name: 'Fortnite',
      platform: Platform.Epic,
      installPath: 'C:\\Program Files\\Epic Games\\Fortnite',
      executablePath: 'C:\\Program Files\\Epic Games\\Fortnite\\FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping.exe',
      process_name: 'FortniteClient-Win64-Shipping.exe',
      icon_url: 'https://cdn2.unrealengine.com/24br-s24-egs-launcher-productart-1920x1080-1920x1080-ec04a20bd189.jpg',
      size: 26 * 1024,
      last_played: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      optimized: true
    },
    {
      id: 'epic-rocketleague',
      name: 'Rocket League',
      platform: Platform.Epic,
      installPath: 'C:\\Program Files\\Epic Games\\rocketleague',
      executablePath: 'C:\\Program Files\\Epic Games\\rocketleague\\Binaries\\Win64\\RocketLeague.exe',
      process_name: 'RocketLeague.exe',
      icon_url: 'https://cdn1.epicgames.com/offer/9773aa1aa54f4f7b80e44bef04986cea/EGS_RocketLeague_PsyonixLLC_S2_1200x1600-c010a13661fb46c1a9f8d097da909b6e',
      size: 20 * 1024,
      last_played: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      optimized: false
    },
    {
      id: 'epic-gtav',
      name: 'Grand Theft Auto V',
      platform: Platform.Epic,
      installPath: 'C:\\Program Files\\Epic Games\\GTAV',
      executablePath: 'C:\\Program Files\\Epic Games\\GTAV\\GTA5.exe',
      process_name: 'GTA5.exe',
      icon_url: 'https://cdn1.epicgames.com/0584d2013f0149a791e7b9bad0eec102/offer/GTAV_EGS_Artwork_1200x1600_Portrait%20Store%20Banner-1200x1600-382243057711adf80322ed2aeea42191.jpg',
      size: 105 * 1024,
      last_played: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      optimized: true
    }
  ];
}