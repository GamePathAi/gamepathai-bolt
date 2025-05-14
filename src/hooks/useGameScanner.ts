import { useState, useEffect, useCallback } from 'react';
import { gameScanner } from '../lib/gameDetection/gameScanner';
import type { GameInfo } from '../lib/gameDetection/types';

export function useGameScanner() {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  useEffect(() => {
    // Carregar jogos iniciais
    scanForGames();
  }, []);

  const scanForGames = useCallback(async () => {
    if (isScanning) return [];
    
    setIsScanning(true);
    setError(null);
    
    try {
      const results = await gameScanner.scanForGames();
      
      // Combinar resultados
      const allGames = results.games || [];
      
      setGames(allGames);
      setLastScanTime(new Date());
      return allGames;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao escanear jogos');
      return [];
    } finally {
      setIsScanning(false);
    }
  }, [isScanning]);

  const launchGame = useCallback(async (gameId: string) => {
    try {
      await gameScanner.launchGame(gameId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao iniciar jogo');
      return false;
    }
  }, []);

  const optimizeGame = useCallback(async (gameId: string, profile: string) => {
    try {
      const result = await gameScanner.optimizeGame(gameId, profile);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao otimizar jogo');
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