import { useState, useEffect } from 'react';
import { Platform } from '../../lib/gameDetection/types';
import { useLocalStorageState as useLocalStorage } from '../useLocalStorageState';

export function useBattleNetDetector() {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useLocalStorage('battle_last_updated', null);

  useEffect(() => {
    const detectGames = async () => {
      try {
        if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.games) {
          console.log('Detecting BattleNet games via Electron API...');
          const detectedGames = await window.electronAPI.games.detectBattleNet();
          setGames(detectedGames || []);
          setLastUpdated(Date.now());
        } else {
          console.log('Not in Electron environment');
          setGames([]);
        }
      } catch (error) {
        console.error('Error detecting BattleNet games:', error);
        setGames([]);
      } finally {
        setIsLoading(false);
      }
    };

    detectGames();
  }, []);

  return {
    platform: Platform.Battle,
    games,
    isLoading,
    lastUpdated
  };
}