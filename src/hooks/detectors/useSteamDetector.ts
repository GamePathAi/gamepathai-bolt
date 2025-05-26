import { useState, useEffect } from 'react';
import { Platform } from '../../lib/gameDetection/types';
import { useLocalStorageState as useLocalStorage } from '../useLocalStorageState';

export function useSteamDetector() {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useLocalStorage('steam_last_updated', null);

  useEffect(() => {
    const detectGames = async () => {
      try {
        if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.games) {
          console.log('Detecting Steam games via Electron API...');
          const detectedGames = await window.electronAPI.games.detectSteam();
          setGames(detectedGames || []);
          setLastUpdated(Date.now());
        } else {
          console.log('Not in Electron environment');
          setGames([]);
        }
      } catch (error) {
        console.error('Error detecting Steam games:', error);
        setGames([]);
      } finally {
        setIsLoading(false);
      }
    };

    detectGames();
  }, []);

  return {
    platform: Platform.Steam,
    games,
    isLoading,
    lastUpdated
  };
}