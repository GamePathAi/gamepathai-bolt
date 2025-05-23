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
  
  // Update games in tray when the list changes
  useEffect(() => {
    const updateTray = async () => {
      if (window.electronAPI?.updateTrayGames) {
        try {
          await window.electronAPI.updateTrayGames(games);
          console.log('Games updated in tray:', games.length);
        } catch (error) {
          console.error('Error updating games in tray:', error);
        }
      }
    };
    
    if (games && games.length > 0) {
      updateTray();
    }
  }, [games]);
  
  // Configure listeners for tray events
  useEffect(() => {
    if (!window.ipcRenderer || listenersConfigured.current) {
      console.log('ipcRenderer not available or listeners already configured');
      return;
    }
    
    console.log('TrayManager: Configuring listeners for tray events');
    listenersConfigured.current = true;
    
    // Handler for scanning games from tray
    const handleScanFromTray = () => {
      console.log('TrayManager: Received command to scan games from tray');
      if (typeof scanGames === 'function') {
        scanGames().catch(err => {
          console.error('Error scanning games:', err);
        });
      } else {
        console.error('scanGames is not a function');
      }
    };
    
    // Handler for launching games from tray
    const handleLaunchFromTray = (event: any, gameId: string) => {
      console.log('TrayManager: Received command to launch game from tray', gameId);
      if (games && Array.isArray(games)) {
        const game = games.find(g => g.id === gameId);
        if (game && typeof launchGame === 'function') {
          launchGame(gameId).catch(err => {
            console.error('Error launching game:', err);
          });
        } else {
          console.error('Game not found or launchGame is not a function:', gameId);
        }
      } else {
        console.error('Games list not available or not an array');
      }
    };
    
    // Handler for optimizing games from tray
    const handleOptimizeFromTray = (event: any, gameId: string) => {
      console.log('TrayManager: Received command to optimize game from tray', gameId);
      if (games && Array.isArray(games)) {
        const game = games.find(g => g.id === gameId);
        if (game && typeof optimizeGame === 'function') {
          optimizeGame(gameId).catch(err => {
            console.error('Error optimizing game:', err);
          });
        } else {
          console.error('Game not found or optimizeGame is not a function:', gameId);
        }
      } else {
        console.error('Games list not available or not an array');
      }
    };
    
    // Register listeners
    window.ipcRenderer.on('scan-games-from-tray', handleScanFromTray);
    window.ipcRenderer.on('launch-game-from-tray', handleLaunchFromTray);
    window.ipcRenderer.on('optimize-game-from-tray', handleOptimizeFromTray);
    
    // Clean up listeners when component is unmounted
    return () => {
      if (listenersConfigured.current) {
        console.log('TrayManager: Removing listeners for tray events');
        window.ipcRenderer.removeListener('scan-games-from-tray', handleScanFromTray);
        window.ipcRenderer.removeListener('launch-game-from-tray', handleLaunchFromTray);
        window.ipcRenderer.removeListener('optimize-game-from-tray', handleOptimizeFromTray);
        listenersConfigured.current = false;
      }
    };
  }, [games, scanGames, launchGame, optimizeGame]);
  
  // Initialize tray with already loaded games
  useEffect(() => {
    const initTray = async () => {
      if (!window.electronAPI?.getGamesForTray || gamesLoaded.current || isLoadingGames.current) {
        return;
      }
      
      try {
        isLoadingGames.current = true;
        console.log('TrayManager: Getting games for the tray');
        const trayGames = await window.electronAPI.getGamesForTray();
        
        if (!trayGames || trayGames.length === 0) {
          console.log('TrayManager: No games in tray, loading initial games');
          if (typeof scanGames === 'function') {
            await scanGames();
          } else {
            console.error('scanGames is not a function');
          }
        } else {
          console.log('TrayManager: Games already loaded in tray:', trayGames.length);
        }
        
        gamesLoaded.current = true;
      } catch (error) {
        console.error('Error getting games for the tray:', error);
      } finally {
        isLoadingGames.current = false;
      }
    };
    
    initTray();
  }, [scanGames]);
  
  // Show notification when app is minimized to tray
  useEffect(() => {
    const showTrayNotification = () => {
      if (window.electronAPI?.showNotification) {
        window.electronAPI.showNotification({
          title: 'GamePath AI',
          body: 'O aplicativo continua em execução na bandeja do sistema.'
        }).catch(e => console.error('Error showing notification:', e));
      }
    };
    
    // You can add a listener for when the window is minimized
    // This would depend on a specific Electron event
    
    return () => {
      // Clean up listeners if necessary
    };
  }, []);
  
  // This component doesn't render anything visible, just manages the tray
  return null;
};