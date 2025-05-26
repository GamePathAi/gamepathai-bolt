import { useState, useEffect } from 'react';
import { Platform } from '../../lib/gameDetection/types';
import { useLocalStorageState as useLocalStorage } from '../useLocalStorageState';

export function useUplayDetector() {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useLocalStorage('ubisoft_last_updated', null);

  useEffect(() => {
    const detectGames = async () => {
      try {
        if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.games) {
          console.log('Detecting Uplay games via Electron API...');
          const detectedGames = await window.electronAPI.games.detectUplay();
          setGames(detectedGames || []);
          setLastUpdated(Date.now());
        } else {
          console.log('Not in Electron environment');
          setGames([]);
        }
      } catch (error) {
        console.error('Error detecting Uplay games:', error);
        setGames([]);
      } finally {
        setIsLoading(false);
      }
    };

    detectGames();
  }, []);

  return {
    platform: Platform.Ubisoft,
    games,
    isLoading,
    lastUpdated
  };
}