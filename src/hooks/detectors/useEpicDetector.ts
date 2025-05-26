import { useState, useEffect } from 'react';
import { Platform } from '../../lib/gameDetection/types';
import { useLocalStorageState as useLocalStorage } from '../useLocalStorageState';

export function useEpicDetector() {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useLocalStorage('epic_last_updated', null);

  useEffect(() => {
    const detectGames = async () => {
      try {
        if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.games) {
          console.log('Detecting Epic games via Electron API...');
          const detectedGames = await window.electronAPI.games.detectEpic();
          setGames(detectedGames || []);
          setLastUpdated(Date.now());
        } else {
          console.log('Not in Electron environment');
          setGames([]);
        }
      } catch (error) {
        console.error('Error detecting Epic games:', error);
        setGames([]);
      } finally {
        setIsLoading(false);
      }
    };

    detectGames();
  }, []);

  return {
    platform: Platform.Epic,
    games,
    isLoading,
    lastUpdated
  };
}