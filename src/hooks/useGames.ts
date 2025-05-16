// src/hooks/useGames.ts
import { useState, useEffect, useCallback } from 'react';
import type { GameInfo } from '../lib/gameDetection/types';

export function useGames() {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadGames = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (window.electronAPI?.scanGames) {
        console.log('Carregando jogos via Electron...');
        const result = await window.electronAPI.scanGames();
        
        if (result.success && Array.isArray(result.data)) {
          console.log('Jogos carregados:', result.data.length);
          setGames(result.data);
        } else {
          console.error('Erro ao carregar jogos:', result.errors);
          setError(result.errors?.join(', ') || 'Falha ao carregar jogos');
        }
      } else {
        console.log('Electron API não disponível, usando dados mockados');
        // Fallback para desenvolvimento web
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
  
  const optimizeGame = useCallback(async (gameId: string) => {
    try {
      if (window.electronAPI?.optimizeGame) {
        const game = games.find(g => g.id === gameId);
        if (game) {
          await window.electronAPI.optimizeGame(game, 'balanced', {});
          
          // Atualizar o jogo na lista
          setGames(prevGames => 
            prevGames.map(g => 
              g.id === gameId ? { ...g, optimized: true } : g
            )
          );
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Erro ao otimizar jogo:', err);
      return false;
    }
  }, [games]);
  
  const launchGame = useCallback(async (gameId: string) => {
    try {
      if (window.electronAPI?.launchGame) {
        const game = games.find(g => g.id === gameId);
        if (game) {
          await window.electronAPI.launchGame(game);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Erro ao lançar jogo:', err);
      return false;
    }
  }, [games]);
  
  return {
    games,
    isLoading,
    error,
    loadGames,
    optimizeGame,
    launchGame
  };
}