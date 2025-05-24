import { useState, useCallback } from 'react';
import type { GameInfo, DetectionResult, DetectorOptions } from '../../lib/gameDetection/types';
import { Platform } from '../../lib/gameDetection/types';
import { useLocalStorage } from '../useLocalStorage';

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

      // In a real implementation, we would use Windows APIs to detect Xbox games
      // For this example, we'll use mock data
      const games = await detectXboxGamesMock();
      
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