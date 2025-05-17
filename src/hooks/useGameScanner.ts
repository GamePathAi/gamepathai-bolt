import { useState, useEffect, useCallback } from 'react';
import { gameScanner } from '../lib/gameDetection/gameScanner';
import type { GameInfo } from '../lib/gameDetection/types';
import { useGameStore } from '../stores/gameStore';

export function useGameScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const { games, setGames, updateGame } = useGameStore();

  // Load games on mount and set up event listeners
  useEffect(() => {
    console.log('useGameScanner: Initializing and loading games');
    loadGames();

    // Set up listener for games-detected event
    const handleGamesDetected = (event: any, detectedGames: GameInfo[]) => {
      console.log(`useGameScanner: Received ${detectedGames.length} games from 'games-detected' event`);
      
      if (Array.isArray(detectedGames) && detectedGames.length > 0) {
        setGames(detectedGames);
        console.log(`useGameScanner: Updated game store with ${detectedGames.length} games from event`);
        
        // Save to localStorage for persistence
        try {
          localStorage.setItem('detected-games', JSON.stringify(detectedGames));
          console.log(`useGameScanner: Saved ${detectedGames.length} games to localStorage`);
        } catch (error) {
          console.error('useGameScanner: Error saving games to localStorage:', error);
        }
      } else {
        console.warn('useGameScanner: Received empty or invalid games array from event');
      }
    };

    // Register the event listener
    if (window.ipcRenderer) {
      console.log('useGameScanner: Registering listener for games-detected event');
      window.ipcRenderer.on('games-detected', handleGamesDetected);
    } else {
      console.warn('useGameScanner: window.ipcRenderer not available, cannot listen for games-detected events');
    }

    // Cleanup function to remove event listener
    return () => {
      if (window.ipcRenderer) {
        console.log('useGameScanner: Removing listener for games-detected event');
        window.ipcRenderer.removeListener('games-detected', handleGamesDetected);
      }
    };
  }, [setGames]);

  const loadGames = async () => {
    try {
      console.log('useGameScanner: Loading games from store/localStorage');
      setError(null);

      // First try to load from localStorage for faster startup
      try {
        const savedGames = localStorage.getItem('detected-games');
        if (savedGames) {
          const parsedGames = JSON.parse(savedGames);
          console.log(`useGameScanner: Loaded ${parsedGames.length} games from localStorage`);
          setGames(parsedGames);
          return;
        }
      } catch (storageError) {
        console.error('useGameScanner: Error loading games from localStorage:', storageError);
      }

      // If localStorage fails, use the gameScanner API
      console.log('useGameScanner: Falling back to gameScanner.getInstalledGames()');
      const { data, error } = await gameScanner.getInstalledGames();
      
      if (error) throw error;
      
      if (data && Array.isArray(data)) {
        console.log(`useGameScanner: Loaded ${data.length} games from gameScanner`);
        setGames(data);
        
        // Save to localStorage
        try {
          localStorage.setItem('detected-games', JSON.stringify(data));
        } catch (storageError) {
          console.error('useGameScanner: Error saving games to localStorage:', storageError);
        }
      } else {
        console.log('useGameScanner: No games found or invalid response from gameScanner');
        setGames([]);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load games');
      console.error('useGameScanner: Error loading games:', error);
    }
  };

  const scanGames = useCallback(async () => {
    if (isScanning) return [];
    
    console.log('useGameScanner: Starting game scan...');
    setIsScanning(true);
    setError(null);
    
    try {
      const result = await gameScanner.scanForGames();
      console.log('useGameScanner: Scan result:', result);
      
      if (result.errors && result.errors.length > 0) {
        console.warn('useGameScanner: Scan completed with errors:', result.errors);
        setError(result.errors.join(', '));
      }
      
      if (result.data && Array.isArray(result.data)) {
        console.log(`useGameScanner: Scan successful, found ${result.data.length} games`);
        setGames(result.data);
        setLastScanTime(new Date());
        
        // Save to localStorage
        try {
          localStorage.setItem('detected-games', JSON.stringify(result.data));
          console.log(`useGameScanner: Saved ${result.data.length} games to localStorage`);
        } catch (storageError) {
          console.error('useGameScanner: Error saving games to localStorage:', storageError);
        }
        
        return result.data;
      } else {
        console.log('useGameScanner: No games found in scan result');
        await loadGames(); // Fallback to loading games
        setLastScanTime(new Date());
        return [];
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to scan for games');
      console.error('useGameScanner: Error scanning for games:', error);
      return [];
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, setGames]);

  const launchGame = useCallback(async (gameId: string) => {
    console.log(`useGameScanner: Launching game with ID ${gameId}`);
    try {
      const isValid = await gameScanner.validateGameFiles(gameId);
      if (!isValid) {
        console.error(`useGameScanner: Game ${gameId} files are corrupted or missing`);
        setError('Game files are corrupted or missing. Please verify the installation.');
        return false;
      }
      console.log(`useGameScanner: Game ${gameId} validation successful, launching`);
      return await gameScanner.launchGame(gameId);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to launch game');
      console.error('useGameScanner: Error launching game:', error);
      return false;
    }
  }, []);

  const optimizeGame = useCallback(async (gameId: string, profile: string = 'balanced') => {
    console.log(`useGameScanner: Optimizing game with ID ${gameId} using profile ${profile}`);
    try {
      const result = await gameScanner.optimizeGame(gameId, profile);
      if (result) {
        console.log(`useGameScanner: Game ${gameId} optimization successful`);
        updateGame(gameId, { optimized: true });
        
        // Update in localStorage as well
        try {
          const savedGames = localStorage.getItem('detected-games');
          if (savedGames) {
            const parsedGames = JSON.parse(savedGames);
            const updatedGames = parsedGames.map((game: GameInfo) => 
              game.id === gameId ? { ...game, optimized: true } : game
            );
            localStorage.setItem('detected-games', JSON.stringify(updatedGames));
            console.log(`useGameScanner: Updated optimized status in localStorage for game ${gameId}`);
          }
        } catch (storageError) {
          console.error('useGameScanner: Error updating game in localStorage:', storageError);
        }
      }
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to optimize game');
      console.error('useGameScanner: Error optimizing game:', error);
      return false;
    }
  }, [updateGame]);

  // Function to load games directly from the tray
  const loadGamesFromTray = useCallback(async () => {
    console.log('useGameScanner: Loading games directly from tray');
    setIsScanning(true);
    setError(null);

    try {
      if (!window.electronAPI?.getGamesFromTray) {
        console.error('useGameScanner: window.electronAPI.getGamesFromTray is not available');
        setError('Tray API is not available');
        return [];
      }

      const trayGames = await window.electronAPI.getGamesFromTray();
      
      if (trayGames && Array.isArray(trayGames) && trayGames.length > 0) {
        console.log(`useGameScanner: Loaded ${trayGames.length} games from tray`);
        setGames(trayGames);
        
        // Save to localStorage
        try {
          localStorage.setItem('detected-games', JSON.stringify(trayGames));
          console.log(`useGameScanner: Saved ${trayGames.length} games from tray to localStorage`);
        } catch (storageError) {
          console.error('useGameScanner: Error saving tray games to localStorage:', storageError);
        }
        
        return trayGames;
      } else {
        console.warn('useGameScanner: No games found in tray or invalid response');
        setError('No games found in tray');
        return [];
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load games from tray');
      console.error('useGameScanner: Error loading games from tray:', error);
      return [];
    } finally {
      setIsScanning(false);
    }
  }, [setGames]);

  // Add diagnostic function to help troubleshoot
  const runDiagnostic = useCallback(async () => {
    console.log('useGameScanner: Running game detection diagnostic');
    try {
      if (!window.electronAPI?.listDetectedGames) {
        console.error('useGameScanner: window.electronAPI.listDetectedGames is not available');
        return { error: 'Diagnostic API is not available' };
      }

      const result = await window.electronAPI.listDetectedGames();
      console.log('useGameScanner: Diagnostic result:', result);
      return result;
    } catch (error) {
      console.error('useGameScanner: Error running diagnostic:', error);
      return { error: error instanceof Error ? error.message : 'Failed to run diagnostic' };
    }
  }, []);

  return {
    games,
    isScanning,
    error,
    lastScanTime,
    scanGames,
    launchGame,
    optimizeGame,
    loadGamesFromTray,
    runDiagnostic,
    setGames // Export setGames for direct usage in components
  };
}