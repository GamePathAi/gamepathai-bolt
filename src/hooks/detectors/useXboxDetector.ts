import { useState, useCallback } from 'react';
import type { GameInfo, DetectionResult, DetectorOptions } from '../../lib/gameDetection/types';
import { Platform } from '../../lib/gameDetection/types';
import { useLocalStorage } from '../useLocalStorage';
import { getXboxGames } from '../../lib/gameDetection/platforms/getXboxGames';
import { mockGetXboxGames } from '../../lib/gameDetection/platforms/mockPlatforms';

// Function to detect if we're in Electron environment
const isElectron = () => {
  return (
    typeof window !== 'undefined' && 
    window.electronAPI !== undefined
  );
};

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

      // Check if we're in Electron environment
      if (!isElectron()) {
        console.log('Not in Electron environment, using mock data for Xbox games');
        const mockGames = await mockGetXboxGames();
        return { platform: Platform.Xbox, games: mockGames };
      }

      // Electron environment - use real detection
      console.log('✅ Electron environment detected, using real detection for Xbox games');
      const games = await getXboxGames();
      
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