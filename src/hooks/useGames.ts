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
    const handleGamesDetected = (event, detectedGames) => {
      console.log(`Recebidos ${detectedGames.length} jogos do processo principal via evento 'games-detected'`);
      
      // Atualizar jogos no estado
      setGames(detectedGames);
      
      // Atualizar jogos no tray também
      if (window.electronAPI?.updateTrayGames) {
        window.electronAPI.updateTrayGames(detectedGames)
          .catch(e => console.error('Erro ao atualizar tray após detecção:', e));
      }
    };
    
    // Registrar o listener
    if (window.ipcRenderer) {
      console.log('Registrando listener para evento games-detected em useGames');
      window.ipcRenderer.on('games-detected', handleGamesDetected);
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
      if (window.ipcRenderer) {
        console.log('Removendo listener para evento games-detected em useGames');
        window.ipcRenderer.removeListener('games-detected', handleGamesDetected);
      }
    };
  }, []);
  
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