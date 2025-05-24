import { useState, useCallback } from 'react';
import type { GameInfo, DetectionResult, DetectorOptions } from '../../lib/gameDetection/types';
import { Platform } from '../../lib/gameDetection/types';
import { useLocalStorage } from '../useLocalStorage';

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

      // Web environment - use mock data
      if (typeof window !== 'undefined' && !window.electronAPI) {
        const games = await detectOriginGamesMock();
        
        // Cache results
        if (options.useCache !== false) {
          await setItem('origin-games', games);
          await setItem('origin-last-scan', new Date().toISOString());
        }
        
        return { platform: Platform.Origin, games };
      }

      // In a real implementation, we would parse Origin installation directories
      // For this example, we'll use mock data
      const games = await detectOriginGamesMock();
      
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

// Mock implementation for Origin games detection
async function detectOriginGamesMock(): Promise<GameInfo[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: 'origin-battlefield-2042',
      name: 'Battlefield 2042',
      platform: Platform.Origin,
      installPath: 'C:\\Program Files (x86)\\Origin Games\\Battlefield 2042',
      executablePath: 'C:\\Program Files (x86)\\Origin Games\\Battlefield 2042\\BF2042.exe',
      process_name: 'BF2042.exe',
      icon_url: 'https://media.contentapi.ea.com/content/dam/battlefield/battlefield-2042/images/2021/04/k-1920x1080-featured-image.jpg.adapt.crop16x9.1023w.jpg',
      size: 45 * 1024,
      last_played: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      optimized: false
    },
    {
      id: 'origin-apex-legends',
      name: 'Apex Legends',
      platform: Platform.Origin,
      installPath: 'C:\\Program Files (x86)\\Origin Games\\Apex',
      executablePath: 'C:\\Program Files (x86)\\Origin Games\\Apex\\r5apex.exe',
      process_name: 'r5apex.exe',
      icon_url: 'https://media.contentapi.ea.com/content/dam/apex-legends/images/2019/01/apex-featured-image-16x9.jpg.adapt.crop16x9.1023w.jpg',
      size: 80 * 1024,
      last_played: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      optimized: true
    },
    {
      id: 'origin-the-sims-4',
      name: 'The Sims 4',
      platform: Platform.Origin,
      installPath: 'C:\\Program Files (x86)\\Origin Games\\The Sims 4',
      executablePath: 'C:\\Program Files (x86)\\Origin Games\\The Sims 4\\Game\\Bin\\TS4_x64.exe',
      process_name: 'TS4_x64.exe',
      icon_url: 'https://media.contentapi.ea.com/content/dam/eacom/SIMS/brand-refresh-assets/images/2019/07/ts4-featured-image-base-refresh.png.adapt.crop16x9.1023w.png',
      size: 30 * 1024,
      last_played: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      optimized: false
    }
  ];
}