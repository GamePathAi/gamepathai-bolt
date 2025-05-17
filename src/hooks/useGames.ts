// src/hooks/useGames.ts
import { useState, useEffect, useCallback } from 'react';
import type { GameInfo } from '../lib/gameDetection/types';
import { gameScanner } from '../lib/gameDetection/gameScanner';

export function useGames() {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadGames = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await gameScanner.getInstalledGames();
      
      if (error) {
        throw error;
      }
      
      if (data && Array.isArray(data)) {
        console.log('Jogos carregados:', data.length);
        setGames(data);
      } else {
        console.log('Nenhum jogo encontrado ou resposta inválida');
        setGames([]);
      }
    } catch (err) {
      console.error('Erro ao carregar jogos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadGames();
  }, [loadGames]);
  
  const scanGames = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await gameScanner.scanForGames();
      
      if (result.success && Array.isArray(result.data)) {
        setGames(result.data);
        return result.data;
      } else {
        console.error('Erro ao escanear jogos:', result.errors);
        setError(result.errors?.join(', ') || 'Falha ao escanear jogos');
        return [];
      }
    } catch (err) {
      console.error('Erro ao escanear jogos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const optimizeGame = useCallback(async (gameId: string) => {
    try {
      const result = await gameScanner.optimizeGame(gameId);
      
      if (result) {
        // Atualizar o jogo na lista
        setGames(prevGames => 
          prevGames.map(g => 
            g.id === gameId ? { ...g, optimized: true } : g
          )
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao otimizar jogo:', err);
      return false;
    }
  }, []);
  
  const launchGame = useCallback(async (gameId: string) => {
    try {
      const result = await gameScanner.launchGame(gameId);
      return result;
    } catch (err) {
      console.error('Erro ao lançar jogo:', err);
      return false;
    }
  }, []);
  
  return {
    games,
    isLoading,
    error,
    loadGames,
    scanGames,
    optimizeGame,
    launchGame
  };
}