// src/components/TrayManager.tsx
import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useGameScanner } from '../hooks/useGameScanner';

export const TrayManager: React.FC = () => {
  const { games } = useGameStore();
  const { scanGames, launchGame, optimizeGame } = useGameScanner();
  const listenersConfigured = useRef(false);
  const gamesLoaded = useRef(false);
  const isLoadingGames = useRef(false);
  
  // Atualizar jogos no tray quando a lista mudar
  useEffect(() => {
    const updateTray = async () => {
      if (window.electronAPI?.updateTrayGames) {
        try {
          await window.electronAPI.updateTrayGames(games);
          console.log('Jogos atualizados no tray:', games.length);
        } catch (error) {
          console.error('Erro ao atualizar jogos no tray:', error);
        }
      }
    };
    
    if (games && games.length > 0) {
      updateTray();
    }
  }, [games]);
  
  // Configurar listeners para eventos do tray
  useEffect(() => {
    if (!window.ipcRenderer || listenersConfigured.current) {
      console.log('ipcRenderer não disponível ou listeners já configurados');
      return;
    }
    
    console.log('TrayManager: Configurando listeners para eventos do tray');
    listenersConfigured.current = true;
    
    // Handler para escanear jogos a partir do tray
    const handleScanFromTray = () => {
      console.log('TrayManager: Recebido comando para escanear jogos a partir do tray');
      if (typeof scanGames === 'function') {
        scanGames().catch(err => {
          console.error('Erro ao escanear jogos:', err);
        });
      } else {
        console.error('scanGames não é uma função');
      }
    };
    
    // Handler para lançar jogos a partir do tray
    const handleLaunchFromTray = (event: any, gameId: string) => {
      console.log('TrayManager: Recebido comando para lançar jogo a partir do tray', gameId);
      if (games && Array.isArray(games)) {
        const game = games.find(g => g.id === gameId);
        if (game && typeof launchGame === 'function') {
          launchGame(gameId).catch(err => {
            console.error('Erro ao lançar jogo:', err);
          });
        } else {
          console.error('Jogo não encontrado ou launchGame não é uma função:', gameId);
        }
      } else {
        console.error('Lista de jogos não disponível ou não é um array');
      }
    };
    
    // Handler para otimizar jogos a partir do tray
    const handleOptimizeFromTray = (event: any, gameId: string) => {
      console.log('TrayManager: Recebido comando para otimizar jogo a partir do tray', gameId);
      if (games && Array.isArray(games)) {
        const game = games.find(g => g.id === gameId);
        if (game && typeof optimizeGame === 'function') {
          optimizeGame(gameId).catch(err => {
            console.error('Erro ao otimizar jogo:', err);
          });
        } else {
          console.error('Jogo não encontrado ou optimizeGame não é uma função:', gameId);
        }
      } else {
        console.error('Lista de jogos não disponível ou não é um array');
      }
    };
    
    // Registrar listeners
    window.ipcRenderer.on('scan-games-from-tray', handleScanFromTray);
    window.ipcRenderer.on('launch-game-from-tray', handleLaunchFromTray);
    window.ipcRenderer.on('optimize-game-from-tray', handleOptimizeFromTray);
    
    // Limpar listeners quando o componente for desmontado
    return () => {
      if (listenersConfigured.current) {
        console.log('TrayManager: Removendo listeners de eventos do tray');
        window.ipcRenderer.removeListener('scan-games-from-tray', handleScanFromTray);
        window.ipcRenderer.removeListener('launch-game-from-tray', handleLaunchFromTray);
        window.ipcRenderer.removeListener('optimize-game-from-tray', handleOptimizeFromTray);
        listenersConfigured.current = false;
      }
    };
  }, [games, scanGames, launchGame, optimizeGame]);
  
  // Inicializar tray com jogos já carregados
  useEffect(() => {
    const initTray = async () => {
      if (!window.electronAPI?.getGamesForTray || gamesLoaded.current || isLoadingGames.current) {
        return;
      }
      
      try {
        isLoadingGames.current = true;
        console.log('TrayManager: Obtendo jogos para o tray');
        const trayGames = await window.electronAPI.getGamesForTray();
        
        if (!trayGames || trayGames.length === 0) {
          console.log('TrayManager: Não há jogos no tray, carregando jogos iniciais');
          if (typeof scanGames === 'function') {
            await scanGames();
          } else {
            console.error('scanGames não é uma função');
          }
        } else {
          console.log('TrayManager: Jogos já carregados no tray:', trayGames.length);
        }
        
        gamesLoaded.current = true;
      } catch (error) {
        console.error('Erro ao obter jogos para o tray:', error);
      } finally {
        isLoadingGames.current = false;
      }
    };
    
    initTray();
  }, [scanGames]);
  
  // Mostrar notificação quando o aplicativo é minimizado para o tray
  useEffect(() => {
    const showTrayNotification = () => {
      if (window.electronAPI?.showNotification) {
        window.electronAPI.showNotification({
          title: 'GamePath AI',
          body: 'O aplicativo continua em execução na bandeja do sistema.'
        }).catch(e => console.error('Erro ao mostrar notificação:', e));
      }
    };
    
    // Você pode adicionar um listener para quando a janela é minimizada
    // Isso dependeria de um evento específico do Electron
    
    return () => {
      // Limpar listeners se necessário
    };
  }, []);
  
  // Este componente não renderiza nada visível, apenas gerencia o tray
  return null;
};