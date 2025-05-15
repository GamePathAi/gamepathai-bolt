import { useState, useEffect, useCallback } from 'react';
import { gameScanner } from '../lib/gameDetection/gameScanner';
import type { GameInfo } from '../lib/gameDetection/types';

export function useGameScanner() {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  // Load games on mount
  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const { data, error } = await gameScanner.getInstalledGames();
      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load games');
    }
  };

  const scanForGames = useCallback(async () => {
    if (isScanning) return [];
    
    setIsScanning(true);
    setError(null);
    
    try {
      const result = await gameScanner.scanForGames();
      
      if (result.errors.length > 0) {
        console.warn('Scan completed with errors:', result.errors);
      }
      
      await loadGames(); // Reload games after scan
      setLastScanTime(new Date());
      return result.games || [];
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to scan for games');
      return [];
    } finally {
      setIsScanning(false);
    }
  }, [isScanning]);

  const launchGame = useCallback(async (gameId: string) => {
    try {
      const isValid = await gameScanner.validateGameFiles(gameId);
      if (!isValid) {
        setError('Game files are corrupted or missing. Please verify the installation.');
        return false;
      }
      await gameScanner.launchGame(gameId);
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to launch game');
      return false;
    }
  }, []);

  const optimizeGame = useCallback(async (gameId: string, profile: string) => {
    try {
      const result = await gameScanner.optimizeGame(gameId, profile);
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to optimize game');
      return false;
    }
  }, []);

  return {
    games,
    isScanning,
    error,
    lastScanTime,
    scanForGames,
    launchGame,
    optimizeGame
  };
}