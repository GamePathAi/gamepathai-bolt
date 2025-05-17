import { useState, useEffect, useCallback } from 'react';
import { gameScanner } from '../lib/gameDetection/gameScanner';
import type { GameInfo } from '../lib/gameDetection/types';
import { useGameStore } from '../stores/gameStore';

export function useGameScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const { games, setGames, updateGame } = useGameStore();

  // Load games on mount
  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setError(null);
      const { data, error } = await gameScanner.getInstalledGames();
      
      if (error) throw error;
      
      if (data && Array.isArray(data)) {
        setGames(data);
      } else {
        console.log('No games found or invalid response');
        setGames([]);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load games');
      console.error('Error loading games:', error);
    }
  };

  const scanGames = useCallback(async () => {
    if (isScanning) return [];
    
    setIsScanning(true);
    setError(null);
    
    try {
      const result = await gameScanner.scanForGames();
      
      if (result.errors && result.errors.length > 0) {
        console.warn('Scan completed with errors:', result.errors);
        setError(result.errors.join(', '));
      }
      
      if (result.data && Array.isArray(result.data)) {
        setGames(result.data);
        setLastScanTime(new Date());
        return result.data;
      } else {
        console.log('No games found in scan result');
        await loadGames(); // Fallback to loading games
        setLastScanTime(new Date());
        return [];
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to scan for games');
      console.error('Error scanning for games:', error);
      return [];
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, setGames]);

  const launchGame = useCallback(async (gameId: string) => {
    try {
      const isValid = await gameScanner.validateGameFiles(gameId);
      if (!isValid) {
        setError('Game files are corrupted or missing. Please verify the installation.');
        return false;
      }
      return await gameScanner.launchGame(gameId);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to launch game');
      console.error('Error launching game:', error);
      return false;
    }
  }, []);

  const optimizeGame = useCallback(async (gameId: string, profile: string = 'balanced') => {
    try {
      const result = await gameScanner.optimizeGame(gameId, profile);
      if (result) {
        updateGame(gameId, { optimized: true });
      }
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to optimize game');
      console.error('Error optimizing game:', error);
      return false;
    }
  }, [updateGame]);

  return {
    games,
    isScanning,
    error,
    lastScanTime,
    scanGames,
    launchGame,
    optimizeGame
  };
}