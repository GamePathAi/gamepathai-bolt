import { useState, useCallback } from 'react';
import type { GameInfo, DetectionResult, DetectorOptions } from '../../lib/gameDetection/types';
import { Platform } from '../../lib/gameDetection/types';
import { useLocalStorage } from '../useLocalStorage';
import { getSteamGames } from '../../lib/gameDetection/platforms/getSteamGames';

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
        console.log('Web environment detected, using mock data for Steam games');
        // Import dynamically to avoid issues
        const { mockGetSteamGames } = await import('../../lib/gameDetection/platforms/mockPlatforms');
        const mockGames = await mockGetSteamGames();
        return { platform: Platform.Steam, games: mockGames };
      }

      // Electron environment - use real detection
      console.log('Detecting Steam games using real detection...');
      const games = await getSteamGames();
      
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