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
async function getMockOriginGames(): Promise<GameInfo[]> {
  return [
    {
      id: 'origin-battlefield2042',
      name: 'Battlefield 2042',
      platform: Platform.Origin,
      installPath: 'C:/Origin Games/Battlefield 2042',
      executablePath: 'C:/Origin Games/Battlefield 2042/BF2042.exe',
      process_name: 'BF2042.exe',
      size: 75000
    },
    {
      id: 'origin-fifa23',
      name: 'FIFA 23',
      platform: Platform.Origin,
      installPath: 'C:/Origin Games/FIFA 23',
      executablePath: 'C:/Origin Games/FIFA 23/FIFA23.exe',
      process_name: 'FIFA23.exe',
      size: 50000
    }
  ];
}

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

      // Check if we're in Electron environment
      if (!isElectron()) {
        console.log('Not in Electron environment, using mock data for Origin games');
        const mockGames = await getMockOriginGames();
        return { platform: Platform.Origin, games: mockGames };
      }

      // Electron environment - use real detection
      console.log('✅ Electron environment detected, using real detection for Origin games');
      const games = await detectOriginGames();
      
      // Cache results
      if (options.useCache !== false && games.length > 0) {
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

// Real implementation for Origin games detection
async function detectOriginGames(): Promise<GameInfo[]> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  // Use the gameAPI if available (preferível e mais robusto)
  if (window.electronAPI.gameAPI && typeof window.electronAPI.gameAPI.detectOriginGames === 'function') {
    try {
      const games = await window.electronAPI.gameAPI.detectOriginGames();
      if (Array.isArray(games)) {
        return games;
      }
    } catch (error) {
      console.error('[Origin] Error using gameAPI.detectOriginGames:', error);
    }
  }

  // Fallback: check system info before tentar detecção manual
  let system: any = undefined;
  if (typeof window.electronAPI.getSystemInfo === 'function') {
    try {
      system = await window.electronAPI.getSystemInfo();
    } catch (e) {
      console.warn('[Origin] Failed to get system info:', e);
    }
  }
  if (!system || system.platform !== 'win32') {
    console.warn('[Origin] System info not available or not Windows. Skipping detection.');
    return [];
  }

  // ... (Aqui poderia entrar a lógica manual antiga, se necessário)
  // Para simplificação, retorna array vazio se não conseguir usar o gameAPI
  return [];
}