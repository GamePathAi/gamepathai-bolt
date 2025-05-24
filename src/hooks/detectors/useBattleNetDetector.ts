import { useState, useCallback } from 'react';
import type { GameInfo, DetectionResult, DetectorOptions } from '../../lib/gameDetection/types';
import { Platform } from '../../lib/gameDetection/types';
import { useLocalStorage } from '../useLocalStorage';

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

      // Web environment - use mock data
      if (typeof window !== 'undefined' && !window.electronAPI) {
        const games = await detectBattleNetGamesMock();
        
        // Cache results
        if (options.useCache !== false) {
          await setItem('battlenet-games', games);
          await setItem('battlenet-last-scan', new Date().toISOString());
        }
        
        return { platform: Platform.Battle, games };
      }

      // In a real implementation, we would parse Battle.net installation directories
      // For this example, we'll use mock data
      const games = await detectBattleNetGamesMock();
      
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

// Mock implementation for Battle.net games detection
async function detectBattleNetGamesMock(): Promise<GameInfo[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: 'battlenet-overwatch2',
      name: 'Overwatch 2',
      platform: Platform.Battle,
      installPath: 'C:\\Program Files (x86)\\Battle.net\\Games\\Overwatch',
      executablePath: 'C:\\Program Files (x86)\\Battle.net\\Games\\Overwatch\\Overwatch.exe',
      process_name: 'Overwatch.exe',
      icon_url: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt0c8f82b1d7a78e4e/622906a991f4232f0085d3cc/Masthead_Overwatch2_Logo.png',
      size: 50 * 1024,
      last_played: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      optimized: true
    },
    {
      id: 'battlenet-wow',
      name: 'World of Warcraft',
      platform: Platform.Battle,
      installPath: 'C:\\Program Files (x86)\\Battle.net\\Games\\World of Warcraft',
      executablePath: 'C:\\Program Files (x86)\\Battle.net\\Games\\World of Warcraft\\Wow.exe',
      process_name: 'Wow.exe',
      icon_url: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/bltd6b49a2d33e715e1/62f5dcd2c1d5855da1673a4e/WoW_Masthead_Logo.png',
      size: 100 * 1024,
      last_played: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      optimized: false
    },
    {
      id: 'battlenet-diablo4',
      name: 'Diablo IV',
      platform: Platform.Battle,
      installPath: 'C:\\Program Files (x86)\\Battle.net\\Games\\Diablo IV',
      executablePath: 'C:\\Program Files (x86)\\Battle.net\\Games\\Diablo IV\\Diablo IV.exe',
      process_name: 'Diablo IV.exe',
      icon_url: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt7c7f5dec2a3fd536/63c5c7f3a8b0b4111ff3fe7c/Diablo_Masthead_Logo.png',
      size: 90 * 1024,
      last_played: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      optimized: true
    }
  ];
}