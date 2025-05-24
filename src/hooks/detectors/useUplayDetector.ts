import { useState, useCallback } from 'react';
import type { GameInfo, DetectionResult, DetectorOptions } from '../../lib/gameDetection/types';
import { Platform } from '../../lib/gameDetection/types';
import { useLocalStorage } from '../useLocalStorage';

export function useUplayDetector() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getItem, setItem } = useLocalStorage();

  const detect = useCallback(async (options: DetectorOptions = {}): Promise<DetectionResult> => {
    if (isDetecting) {
      return { platform: Platform.Ubisoft, games: [], error: 'Detection already in progress' };
    }

    setIsDetecting(true);
    setError(null);

    try {
      // Check if we should use cache
      if (options.useCache !== false) {
        const cachedGames = await getItem<GameInfo[]>('uplay-games');
        const cachedTime = await getItem<string>('uplay-last-scan');
        
        if (cachedGames && cachedGames.length > 0 && cachedTime && !options.forceRefresh) {
          const lastScan = new Date(cachedTime);
          const now = new Date();
          const timeDiff = now.getTime() - lastScan.getTime();
          
          // Use cache if it's less than 1 hour old
          if (timeDiff < 60 * 60 * 1000) {
            return { platform: Platform.Ubisoft, games: cachedGames };
          }
        }
      }

      // Web environment - use mock data
      if (typeof window !== 'undefined' && !window.electronAPI) {
        const games = await detectUplayGamesMock();
        
        // Cache results
        if (options.useCache !== false) {
          await setItem('uplay-games', games);
          await setItem('uplay-last-scan', new Date().toISOString());
        }
        
        return { platform: Platform.Ubisoft, games };
      }

      // In a real implementation, we would parse Ubisoft Connect installation directories
      // For this example, we'll use mock data
      const games = await detectUplayGamesMock();
      
      // Cache results
      if (options.useCache !== false) {
        await setItem('uplay-games', games);
        await setItem('uplay-last-scan', new Date().toISOString());
      }
      
      return { platform: Platform.Ubisoft, games };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error detecting Ubisoft Connect games';
      setError(errorMessage);
      console.error('Error detecting Ubisoft Connect games:', err);
      return { platform: Platform.Ubisoft, games: [], error: errorMessage };
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

// Mock implementation for Ubisoft Connect games detection
async function detectUplayGamesMock(): Promise<GameInfo[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: 'uplay-assassins-creed-valhalla',
      name: 'Assassin\'s Creed Valhalla',
      platform: Platform.Ubisoft,
      installPath: 'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games\\Assassin\'s Creed Valhalla',
      executablePath: 'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games\\Assassin\'s Creed Valhalla\\ACValhalla.exe',
      process_name: 'ACValhalla.exe',
      icon_url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/449BBgnQKEMXlgaHzO3gZZ/7f8c3bdc5ebc5088e0e3f35c309c5a9d/acv-boxshot.jpg',
      size: 70 * 1024,
      last_played: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      optimized: true
    },
    {
      id: 'uplay-rainbow-six-siege',
      name: 'Tom Clancy\'s Rainbow Six Siege',
      platform: Platform.Ubisoft,
      installPath: 'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games\\Rainbow Six Siege',
      executablePath: 'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games\\Rainbow Six Siege\\RainbowSix.exe',
      process_name: 'RainbowSix.exe',
      icon_url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/7qSZbSIiI3i2xM9vlnHSS0/5713b53a56a3ef7b0aacb03655c3c9c7/r6s-boxshot.jpg',
      size: 65 * 1024,
      last_played: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      optimized: true
    },
    {
      id: 'uplay-far-cry-6',
      name: 'Far Cry 6',
      platform: Platform.Ubisoft,
      installPath: 'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games\\Far Cry 6',
      executablePath: 'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games\\Far Cry 6\\bin\\FarCry6.exe',
      process_name: 'FarCry6.exe',
      icon_url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/5KNU8QzLQTJJyCMoLXZzxn/f2e82b8aef63b181c76b31b7e35fa2fd/fc6-boxshot.jpg',
      size: 85 * 1024,
      last_played: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      optimized: false
    }
  ];
}