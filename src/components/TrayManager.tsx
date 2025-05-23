// src/components/TrayManager.tsx - Compatível com Main.cjs Professional v3.0
import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useGameScanner } from '../hooks/useGameScanner';

interface TrayGame {
  id: string;
  name: string;
  platform: string;
  familyIcon?: string;
  cleanName?: string;
  gameFamily?: string;
  isMainGame?: boolean;
}

export const TrayManager: React.FC = () => {
  const { games } = useGameStore();
  const { scanGames, launchGame, optimizeSystem } = useGameScanner();
  
  // Refs para controle de estado
  const listenersConfigured = useRef(false);
  const lastGameUpdate = useRef<number>(0);
  const trayUpdateTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Verificar se electronAPI está disponível
  const isElectronAPIAvailable = useCallback(() => {
    return typeof window !== 'undefined' && 
           window.electronAPI && 
           typeof window.electronAPI === 'object' &&
           window.electronAPI.tray &&
           typeof window.electronAPI.tray.updateGames === 'function';
  }, []);

  // Função para sanitizar jogos para o tray (compatível com main.cjs)
  const sanitizeGamesForTray = useCallback((gameList: any[]): TrayGame[] => {
    if (!Array.isArray(gameList)) {
      console.warn('TrayManager: Lista de jogos não é um array:', gameList);
      return [];
    }

    return gameList
      .filter(game => {
        // Filtrar apenas jogos válidos
        return game && 
               game.id && 
               game.name && 
               game.platform &&
               !game.name.toLowerCase().includes('redistributable') &&
               !game.name.toLowerCase().includes('steamworks');
      })
      .slice(0, 10) // Limitar a 10 jogos no tray
      .map(game => ({
        id: game.id,
        name: game.cleanName || game.name,
        platform: game.platform,
        familyIcon: game.familyIcon || game.platformInfo?.icon || '🎮',
        cleanName: game.cleanName,
        gameFamily: game.gameFamily,
        isMainGame: game.isMainGame !== false
      }));
  }, []);

  // Atualizar jogos no tray (debounced)
  const updateTrayGames = useCallback(async (gameList: any[]) => {
    if (!isElectronAPIAvailable()) {
      console.warn('TrayManager: electronAPI não disponível para atualização');
      return;
    }

    // Clear timeout anterior
    if (trayUpdateTimeout.current) {
      clearTimeout(trayUpdateTimeout.current);
    }

    // Debounce para evitar updates frequentes
    trayUpdateTimeout.current = setTimeout(async () => {
      try {
        const sanitizedGames = sanitizeGamesForTray(gameList);
        
        console.log('TrayManager: Atualizando tray com jogos:', {
          total: gameList.length,
          sanitized: sanitizedGames.length,
          games: sanitizedGames.map(g => `${g.familyIcon} ${g.name}`)
        });

        // Usar método específico do tray
        if (window.electronAPI?.tray?.updateGames) {
          const result = window.electronAPI.tray.updateGames(sanitizedGames);
          
          if (result.success) {
            console.log('TrayManager: Tray atualizado com sucesso');
            lastGameUpdate.current = Date.now();
          } else {
            console.error('TrayManager: Erro ao atualizar tray:', result.error);
          }
        }
        
      } catch (error) {
        console.error('TrayManager: Erro ao atualizar jogos no tray:', error);
      }
    }, 500); // 500ms debounce
  }, [isElectronAPIAvailable, sanitizeGamesForTray]);

  // Configurar listeners para eventos do tray
  useEffect(() => {
    if (!isElectronAPIAvailable() || listenersConfigured.current) {
      return;
    }
    
    console.log('TrayManager: Configurando listeners para eventos do tray');
    
    try {
      // Handler para escaneamento via tray
      const handleTrayScanGames = async () => {
        console.log('TrayManager: 🔍 Escaneamento solicitado via tray');
        
        try {
          if (typeof scanGames === 'function') {
            await scanGames();
            console.log('TrayManager: Escaneamento via tray concluído');
          } else {
            console.error('TrayManager: scanGames não é uma função');
          }
        } catch (error) {
          console.error('TrayManager: Erro no escaneamento via tray:', error);
        }
      };

      // Handler para lançamento via tray
      const handleTrayLaunchGame = async (data: { gameId: string }) => {
        console.log('TrayManager: 🚀 Lançamento solicitado via tray:', data.gameId);
        
        try {
          if (typeof launchGame === 'function') {
            await launchGame(data.gameId);
            console.log('TrayManager: Jogo lançado via tray:', data.gameId);
          } else {
            console.error('TrayManager: launchGame não é uma função');
          }
        } catch (error) {
          console.error('TrayManager: Erro no lançamento via tray:', error);
        }
      };

      // Handler para otimização de jogo via tray
      const handleTrayOptimizeGame = async (data: { gameId: string }) => {
        console.log('TrayManager: ⚡ Otimização de jogo solicitada via tray:', data.gameId);
        
        try {
          // Primeiro otimizar o sistema
          if (typeof optimizeSystem === 'function') {
            await optimizeSystem('ultra-performance');
            console.log('TrayManager: Sistema otimizado para jogo:', data.gameId);
          } else {
            console.error('TrayManager: optimizeSystem não é uma função');
          }
        } catch (error) {
          console.error('TrayManager: Erro na otimização via tray:', error);
        }
      };

      // Handler para otimização do sistema via tray
      const handleTrayOptimizeSystem = async (data: { profile: string }) => {
        console.log('TrayManager: ⚡ Otimização de sistema solicitada via tray:', data.profile);
        
        try {
          if (typeof optimizeSystem === 'function') {
            await optimizeSystem(data.profile || 'balanced-fps');
            console.log('TrayManager: Otimização de sistema concluída:', data.profile);
          } else {
            console.error('TrayManager: optimizeSystem não é uma função');
          }
        } catch (error) {
          console.error('TrayManager: Erro na otimização de sistema via tray:', error);
        }
      };

      // Registrar listeners usando o sistema de eventos do preload
      if (window.electronAPI?.events && typeof window.electronAPI.events.on === 'function') {
        window.electronAPI.events.on('tray:scan-games', handleTrayScanGames);
        window.electronAPI.events.on('tray:game-launch', handleTrayLaunchGame);
        window.electronAPI.events.on('tray:game-optimize', handleTrayOptimizeGame);
        window.electronAPI.events.on('tray:system-optimize', handleTrayOptimizeSystem);
        
        listenersConfigured.current = true;
        console.log('TrayManager: ✅ Listeners configurados com sucesso');
      } else {
        console.warn('TrayManager: Sistema de eventos não disponível');
      }
      
    } catch (error) {
      console.error('TrayManager: Erro ao configurar listeners:', error);
    }
    
    // Cleanup
    return () => {
      if (listenersConfigured.current && window.electronAPI?.events?.removeAll) {
        console.log('TrayManager: 🧹 Removendo listeners de eventos do tray');
        
        try {
          window.electronAPI.events.removeAll('tray:scan-games');
          window.electronAPI.events.removeAll('tray:game-launch');
          window.electronAPI.events.removeAll('tray:game-optimize');
          window.electronAPI.events.removeAll('tray:system-optimize');
          
          listenersConfigured.current = false;
        } catch (error) {
          console.warn('TrayManager: Erro ao remover listeners:', error);
        }
      }
    };
  }, [scanGames, launchGame, optimizeSystem, isElectronAPIAvailable]);

  // Atualizar tray quando jogos mudam
  useEffect(() => {
    if (!games || games.length === 0) {
      return;
    }

    // Verificar se houve mudanças significativas
    const currentTime = Date.now();
    const timeSinceLastUpdate = currentTime - lastGameUpdate.current;
    
    // Só atualizar se passou tempo suficiente ou se é primeira vez
    if (timeSinceLastUpdate > 2000 || lastGameUpdate.current === 0) {
      console.log('TrayManager: 🎮 Jogos atualizados, sincronizando com tray');
      updateTrayGames(games);
    }
  }, [games, updateTrayGames]);

  // Inicialização do tray
  useEffect(() => {
    const initializeTray = async () => {
      if (!isElectronAPIAvailable()) {
        console.warn('TrayManager: electronAPI não disponível durante inicialização');
        return;
      }

      try {
        console.log('TrayManager: 🚀 Inicializando integração do tray');
        
        // Aguardar um pouco para garantir que tudo esteja carregado
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Se já temos jogos, atualizar o tray
        if (games && games.length > 0) {
          console.log('TrayManager: Jogos disponíveis, atualizando tray');
          await updateTrayGames(games);
        } else {
          console.log('TrayManager: Nenhum jogo disponível ainda');
        }
        
        console.log('TrayManager: ✅ Integração do tray inicializada');
        
      } catch (error) {
        console.error('TrayManager: Erro na inicialização do tray:', error);
      }
    };

    initializeTray();
  }, [isElectronAPIAvailable, updateTrayGames, games]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (trayUpdateTimeout.current) {
        clearTimeout(trayUpdateTimeout.current);
      }
    };
  }, []);

  // Debug: Log estado atual
  useEffect(() => {
    const debugInfo = {
      gamesCount: games?.length || 0,
      listenersConfigured: listenersConfigured.current,
      electronAPIAvailable: isElectronAPIAvailable(),
      lastUpdate: lastGameUpdate.current,
      timeSinceLastUpdate: Date.now() - lastGameUpdate.current
    };
    
    console.log('TrayManager: 📊 Estado atual:', debugInfo);
  }, [games, isElectronAPIAvailable]);

  // Este componente não renderiza nada
  return null;
};

// Função utilitária para testar integração do tray
export const testTrayIntegration = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !window.electronAPI) {
    console.warn('TrayManager: electronAPI não disponível para teste');
    return false;
  }

  try {
    console.log('TrayManager: 🧪 Testando integração do tray...');
    
    // Teste 1: Verificar se tray está disponível
    if (!window.electronAPI.tray || typeof window.electronAPI.tray.updateGames !== 'function') {
      console.error('TrayManager: Tray API não disponível');
      return false;
    }
    
    // Teste 2: Tentar atualizar com jogos mock
    const mockGames = [
      {
        id: 'test-game-1',
        name: 'Test Game 1',
        platform: 'Steam',
        familyIcon: '🎮'
      },
      {
        id: 'test-game-2',
        name: 'Test Game 2',
        platform: 'Xbox',
        familyIcon: '🔫'
      }
    ];
    
    const result = window.electronAPI.tray.updateGames(mockGames);
    
    if (result.success) {
      console.log('TrayManager: ✅ Teste de integração bem-sucedido');
      return true;
    } else {
      console.error('TrayManager: ❌ Teste de integração falhou:', result.error);
      return false;
    }
    
  } catch (error) {
    console.error('TrayManager: ❌ Erro no teste de integração:', error);
    return false;
  }
};

// Função para forçar atualização do tray
export const forceTrayUpdate = async (gameList: any[]): Promise<boolean> => {
  if (typeof window === 'undefined' || !window.electronAPI?.tray) {
    return false;
  }

  try {
    const sanitizedGames = gameList
      .filter(game => game && game.id && game.name)
      .slice(0, 10)
      .map(game => ({
        id: game.id,
        name: game.cleanName || game.name,
        platform: game.platform,
        familyIcon: game.familyIcon || '🎮'
      }));

    const result = window.electronAPI.tray.updateGames(sanitizedGames);
    
    if (result.success) {
      console.log('TrayManager: ✅ Atualização forçada bem-sucedida');
      return true;
    } else {
      console.error('TrayManager: ❌ Atualização forçada falhou:', result.error);
      return false;
    }
    
  } catch (error) {
    console.error('TrayManager: ❌ Erro na atualização forçada:', error);
    return false;
  }
};

export default TrayManager;