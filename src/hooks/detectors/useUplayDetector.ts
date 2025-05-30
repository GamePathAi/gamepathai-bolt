import { useState, useCallback } from 'react';
import type { GameInfo, DetectionResult, DetectorOptions } from '../../lib/gameDetection/types';
import { Platform } from '../../lib/gameDetection/types';
import { useLocalStorage } from '../useLocalStorage';

// Path utilities - NO EXTERNAL DEPENDENCIES!
const pathUtils = {
  join: (...segments: string[]): string => {
    return segments
      .filter(Boolean)
      .join('/')
      .replace(/[\\\/]+/g, '/')
      .replace(/^\/+|\/+$/g, '');
  },
  basename: (filepath: string): string => {
    return filepath.split(/[\\\/]/).pop() || '';
  },
  dirname: (filepath: string): string => {
    const parts = filepath.split(/[\\\/]/);
    parts.pop();
    return parts.join('/') || '/';
  }
};

// Function to detect if we're in Electron environment
const isElectron = () => {
  return (
    typeof window !== 'undefined' && 
    window.electronAPI !== undefined
  );
};

// Mock data for non-Electron environment
async function getMockUplayGames(): Promise<GameInfo[]> {
  return [
    {
      id: 'uplay-assassinscreed-valhalla',
      name: "Assassin's Creed Valhalla",
      platform: Platform.Ubisoft,
      installPath: 'C:/Ubisoft Games/Assassins Creed Valhalla',
      executablePath: 'C:/Ubisoft Games/Assassins Creed Valhalla/ACValhalla.exe',
      process_name: 'ACValhalla.exe',
      size: 80000
    },
    {
      id: 'uplay-farcry6',
      name: 'Far Cry 6',
      platform: Platform.Ubisoft,
      installPath: 'C:/Ubisoft Games/Far Cry 6',
      executablePath: 'C:/Ubisoft Games/Far Cry 6/bin/FarCry6.exe',
      process_name: 'FarCry6.exe',
      size: 60000
    }
  ];
}

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

      // Check if we're in Electron environment
      if (!isElectron()) {
        console.log('Not in Electron environment, using mock data for Uplay games');
        const mockGames = await getMockUplayGames();
        return { platform: Platform.Ubisoft, games: mockGames };
      }

      // Electron environment - use real detection
      console.log('✅ Electron environment detected, using real detection for Uplay games');
      const games = await detectUplayGames();
      
      // Cache results
      if (options.useCache !== false && games.length > 0) {
        await setItem('uplay-games', games);
        await setItem('uplay-last-scan', new Date().toISOString());
      }
      
      return { platform: Platform.Ubisoft, games };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error detecting Uplay games';
      setError(errorMessage);
      console.error('Error detecting Uplay games:', err);
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

// Real implementation for Uplay games detection
async function detectUplayGames(): Promise<GameInfo[]> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  // Use the gameAPI if available (preferível e mais robusto)
  if (window.electronAPI.gameAPI && typeof window.electronAPI.gameAPI.detectUplayGames === 'function') {
    try {
      const games = await window.electronAPI.gameAPI.detectUplayGames();
      if (Array.isArray(games)) {
        return games;
      }
    } catch (error) {
      console.error('[Uplay] Error using gameAPI.detectUplayGames:', error);
    }
  }

  // Fallback: check system info before tentar detecção manual
  let system: any = undefined;
  if (typeof window.electronAPI.getSystemInfo === 'function') {
    try {
      system = await window.electronAPI.getSystemInfo();
    } catch (e) {
      console.warn('[Uplay] Failed to get system info:', e);
    }
  }
  if (!system || system.platform !== 'win32') {
    console.warn('[Uplay] System info not available or not Windows. Skipping detection.');
    return [];
  }

  // ... (Aqui poderia entrar a lógica manual antiga, se necessário)
  // Para simplificação, retorna array vazio se não conseguir usar o gameAPI
  return [];
}