import { useState, useCallback } from 'react';
import type { GameInfo, DetectionResult, DetectorOptions } from '../../lib/gameDetection/types';
import { Platform } from '../../lib/gameDetection/types';
import { useLocalStorage } from '../useLocalStorage';

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

      // In a real implementation, we would parse GOG Galaxy installation directories
      // For this example, we'll use mock data
      const games = await detectGOGGamesMock();
      
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