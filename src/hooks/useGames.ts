// src/hooks/useGames.ts
import { useState, useEffect, useCallback } from 'react';
import type { GameInfo } from '../lib/gameDetection/types';

export function useGames() {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ... código existente ...
  
  // Adicione este useEffect para escutar eventos de jogos detectados
  useEffect(() => {
    // Função para receber jogos do processo principal
    const handleGamesDetected = (event: any, detectedGames: GameInfo[]) => {
      console.log(`Recebidos ${detectedGames.length} jogos do processo principal via evento 'games-detected'`);
      
      // Atualizar jogos no estado
      setGames(detectedGames);
      
      // Atualizar jogos no tray também
      if (window.electronAPI?.tray?.updateGames) {
        window.electronAPI.tray.updateGames(detectedGames)
          .catch(e => console.error('Erro ao atualizar tray após detecção:', e));
      }
    };
    
    // Registrar o listener
    if (window.electronAPI?.events?.on) {
      console.log('Registrando listener para evento games-detected em useGames');
      window.electronAPI.events.on('games-detected', handleGamesDetected);
    }
    
    // Carregar jogos do localStorage se disponíveis
    try {
      const savedGames = localStorage.getItem('detected-games');
      if (savedGames) {
        const parsedGames = JSON.parse(savedGames);
        console.log(`Carregados ${parsedGames.length} jogos do localStorage`);
        setGames(parsedGames);
      }
    } catch (error) {
      console.error('Erro ao carregar jogos do localStorage:', error);
    }
    
    // Limpar listener ao desmontar
    return () => {
      if (window.electronAPI?.events?.off) {
        console.log('Removendo listener para evento games-detected em useGames');
        window.electronAPI.events.off('games-detected', handleGamesDetected);
      }
    };
  }, []);
  
  // Implementação de loadGames
  const loadGames = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Primeiro tentar carregar do localStorage
      const savedGames = localStorage.getItem('detected-games');
      if (savedGames) {
        const parsedGames = JSON.parse(savedGames);
        setGames(parsedGames);
        setIsLoading(false);
        return;
      }
      
      // Se não houver jogos no localStorage, tentar carregar via API
      if (window.electronAPI?.games?.scan) {
        const result = await window.electronAPI.games.scan();
        if (result.success && Array.isArray(result.data)) {
          setGames(result.data);
          
          // Salvar no localStorage
          localStorage.setItem('detected-games', JSON.stringify(result.data));
        } else {
          setError(result.error || 'Falha ao carregar jogos');
        }
      } else {
        setError('API de jogos não disponível');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Implementação de optimizeGame
  const optimizeGame = useCallback(async (gameId: string) => {
    if (!window.electronAPI?.optimization?.optimizeForGame) {
      return false;
    }
    
    try {
      const game = games.find(g => g.id === gameId);
      if (!game) return false;
      
      const result = await window.electronAPI.optimization.optimizeForGame(game);
      return result.success;
    } catch (error) {
      console.error('Erro ao otimizar jogo:', error);
      return false;
    }
  }, [games]);
  
  // Implementação de launchGame
  const launchGame = useCallback(async (gameId: string) => {
    if (!window.electronAPI?.launcher?.launch) {
      return false;
    }
    
    try {
      const game = games.find(g => g.id === gameId);
      if (!game) return false;
      
      const result = await window.electronAPI.launcher.launch(game);
      return result.success;
    } catch (error) {
      console.error('Erro ao lançar jogo:', error);
      return false;
    }
  }, [games]);
  
  return {
    games,
    setGames, // Exporte setGames também para permitir atualização externa
    isLoading,
    error,
    loadGames,
    optimizeGame,
    launchGame
  };
}