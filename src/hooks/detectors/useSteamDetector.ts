import { useState, useCallback } from 'react';
import type { GameInfo, DetectionResult, DetectorOptions } from '../../lib/gameDetection/types';
import { Platform } from '../../lib/gameDetection/types';
import { useLocalStorage } from '../useLocalStorage';

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

      // Web environment - use mock data
      if (typeof window !== 'undefined' && !window.electronAPI) {
        const games = await detectSteamGamesMock();
        
        // Cache results
        if (options.useCache !== false) {
          await setItem('steam-games', games);
          await setItem('steam-last-scan', new Date().toISOString());
        }
        
        return { platform: Platform.Steam, games };
      }

      // In a real implementation, we would use the Steam Web API or parse local files
      // For this example, we'll use mock data
      const games = await detectSteamGamesMock();
      
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

// Mock implementation for Steam games detection
async function detectSteamGamesMock(): Promise<GameInfo[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: 'steam-730',
      name: 'Counter-Strike 2',
      platform: Platform.Steam,
      installPath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive',
      executablePath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\cs2.exe',
      process_name: 'cs2.exe',
      icon_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg',
      size: 35 * 1024,
      last_played: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      optimized: false
    },
    {
      id: 'steam-1091500',
      name: 'Cyberpunk 2077',
      platform: Platform.Steam,
      installPath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Cyberpunk 2077',
      executablePath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Cyberpunk 2077\\bin\\x64\\Cyberpunk2077.exe',
      process_name: 'Cyberpunk2077.exe',
      icon_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg',
      size: 102 * 1024,
      last_played: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      optimized: true
    },
    {
      id: 'steam-1245620',
      name: 'Elden Ring',
      platform: Platform.Steam,
      installPath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\ELDEN RING',
      executablePath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\ELDEN RING\\Game\\eldenring.exe',
      process_name: 'eldenring.exe',
      icon_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg',
      size: 60 * 1024,
      last_played: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      optimized: false
    },
    {
      id: 'steam-1086940',
      name: 'Baldur\'s Gate 3',
      platform: Platform.Steam,
      installPath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Baldurs Gate 3',
      executablePath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Baldurs Gate 3\\bin\\bg3.exe',
      process_name: 'bg3.exe',
      icon_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg',
      size: 122 * 1024,
      last_played: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      optimized: true
    }
  ];
}