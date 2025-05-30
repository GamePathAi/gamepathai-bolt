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
async function getMockGOGGames(): Promise<GameInfo[]> {
  return [
    {
      id: 'gog-witcher3',
      name: 'The Witcher 3: Wild Hunt',
      platform: Platform.GOG,
      installPath: 'C:/GOG Games/The Witcher 3 Wild Hunt',
      executablePath: 'C:/GOG Games/The Witcher 3 Wild Hunt/bin/x64/witcher3.exe',
      process_name: 'witcher3.exe',
      size: 35000
    },
    {
      id: 'gog-cyberpunk2077',
      name: 'Cyberpunk 2077',
      platform: Platform.GOG,
      installPath: 'C:/GOG Games/Cyberpunk 2077',
      executablePath: 'C:/GOG Games/Cyberpunk 2077/bin/x64/Cyberpunk2077.exe',
      process_name: 'Cyberpunk2077.exe',
      size: 70000
    }
  ];
}

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

      // Check if we're in Electron environment
      if (!isElectron()) {
        console.log('Not in Electron environment, using mock data for GOG games');
        const mockGames = await getMockGOGGames();
        return { platform: Platform.GOG, games: mockGames };
      }

      // Electron environment - use real detection
      console.log('✅ Electron environment detected, using real detection for GOG games');
      const games = await detectGOGGames();
      
      // Cache results
      if (options.useCache !== false && games.length > 0) {
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

// Real implementation for GOG games detection
async function detectGOGGames(): Promise<GameInfo[]> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  // Use the gameAPI if available (preferível e mais robusto)
  if (window.electronAPI.gameAPI && typeof window.electronAPI.gameAPI.detectGOGGames === 'function') {
    try {
      const games = await window.electronAPI.gameAPI.detectGOGGames();
      if (Array.isArray(games)) {
        return games;
      }
    } catch (error) {
      console.error('[GOG] Error using gameAPI.detectGOGGames:', error);
    }
  }

  // Fallback: check system info before tentar detecção manual
  let system: any = undefined;
  if (typeof window.electronAPI.getSystemInfo === 'function') {
    try {
      system = await window.electronAPI.getSystemInfo();
    } catch (e) {
      console.warn('[GOG] Failed to get system info:', e);
    }
  }
  if (!system || system.platform !== 'win32') {
    console.warn('[GOG] System info not available or not Windows. Skipping detection.');
    return [];
  }

  // ... (Aqui poderia entrar a lógica manual antiga, se necessário)
  // Para simplificação, retorna array vazio se não conseguir usar o gameAPI
  return [];
}