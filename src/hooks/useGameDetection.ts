import { useState, useEffect, useCallback } from 'react';
import { useSteamDetector } from './detectors/useSteamDetector';
import { useEpicDetector } from './detectors/useEpicDetector';
import { useXboxDetector } from './detectors/useXboxDetector';
import { useOriginDetector } from './detectors/useOriginDetector';
import { useBattleNetDetector } from './detectors/useBattleNetDetector';
import { useGOGDetector } from './detectors/useGOGDetector';
import { useUplayDetector } from './detectors/useUplayDetector';
import { useLocalStorage } from './useLocalStorage';
import type { GameInfo, DetectionResult, DetectorOptions } from '../lib/gameDetection/types';

export function useGameDetection() {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allGames, setAllGames] = useState<GameInfo[]>([]);
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const { getItem, setItem } = useLocalStorage();

  // Initialize platform-specific detectors
  const steamDetector = useSteamDetector();
  const epicDetector = useEpicDetector();
  const xboxDetector = useXboxDetector();
  const originDetector = useOriginDetector();
  const battleNetDetector = useBattleNetDetector();
  const gogDetector = useGOGDetector();
  const uplayDetector = useUplayDetector();

  // All detectors
  const detectors = [
    steamDetector,
    epicDetector,
    xboxDetector,
    originDetector,
    battleNetDetector,
    gogDetector,
    uplayDetector
  ];

  // Update allGames when any detector updates
  useEffect(() => {
    const games: GameInfo[] = [];
    const detectionResults: DetectionResult[] = [];

    detectors.forEach(detector => {
      games.push(...detector.games);
      detectionResults.push({
        platform: detector.platform,
        games: detector.games,
        error: detector.error || undefined
      });
    });

    setAllGames(games);
    setResults(detectionResults);
  }, [
    steamDetector.games,
    epicDetector.games,
    xboxDetector.games,
    originDetector.games,
    battleNetDetector.games,
    gogDetector.games,
    uplayDetector.games
  ]);

  // Check if any detector is loading
  useEffect(() => {
    const anyLoading = detectors.some(d => d.isLoading);
    setIsScanning(anyLoading);
  }, [
    steamDetector.isLoading,
    epicDetector.isLoading,
    xboxDetector.isLoading,
    originDetector.isLoading,
    battleNetDetector.isLoading,
    gogDetector.isLoading,
    uplayDetector.isLoading
  ]);

  // Load cached games on mount
  useEffect(() => {
    const loadCachedGames = async () => {
      try {
        const cachedGames = await getItem<GameInfo[]>('detected-games');
        if (cachedGames && cachedGames.length > 0) {
          // Don't override if we already have games from detectors
          if (allGames.length === 0) {
            setAllGames(cachedGames);
          }
        }
      } catch (error) {
        console.error('Error loading cached games:', error);
      }
    };

    loadCachedGames();
  }, [getItem]);

  // Save games to cache when they change
  useEffect(() => {
    if (allGames.length > 0) {
      setItem('detected-games', allGames);
      setItem('last-scan-time', new Date().toISOString());
      setLastScanTime(new Date());
    }
  }, [allGames, setItem]);

  // Scan for games on all platforms (triggers re-detection)
  const scanAllPlatforms = useCallback(async (options: DetectorOptions = {}) => {
    // For now, just return current games since detectors auto-detect
    // In the future, we could trigger manual scans through electronAPI
    console.log('Scanning all platforms...', options);
    
    // Clear cache if force refresh
    if (options.forceRefresh) {
      await setItem('detected-games', null);
      await setItem('last-scan-time', null);
      // Reload the page to trigger re-detection
      window.location.reload();
    }
    
    return allGames;
  }, [allGames, setItem]);

  // Scan for games on a specific platform
  const scanPlatform = useCallback(async (platform: string, options: DetectorOptions = {}) => {
    console.log(`Scanning ${platform}...`, options);
    
    // Find the detector for this platform
    const detector = detectors.find(d => 
      d.platform.toLowerCase() === platform.toLowerCase()
    );
    
    if (detector) {
      return detector.games;
    }
    
    return [];
  }, [detectors]);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      await setItem('detected-games', null);
      await setItem('last-scan-time', null);
      setAllGames([]);
      setResults([]);
      setLastScanTime(null);
      // Reload to trigger re-detection
      window.location.reload();
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }, [setItem]);

  // Get games by platform
  const getGamesByPlatform = useCallback((platform: string) => {
    return allGames.filter(game => 
      game.platform.toLowerCase() === platform.toLowerCase()
    );
  }, [allGames]);

  // Get unique platforms
  const platforms = [...new Set(allGames.map(game => game.platform))];

  return {
    // State
    isScanning,
    error,
    games: allGames,  // AQUI! Estava faltando
    allGames,
    results,
    platforms,
    lastScanTime,
    
    // Actions
    scanAllPlatforms,
    scanPlatform,
    clearCache,
    getGamesByPlatform,
    
    // Individual detector states
    detectors: {
      steam: steamDetector,
      epic: epicDetector,
      xbox: xboxDetector,
      origin: originDetector,
      battleNet: battleNetDetector,
      gog: gogDetector,
      uplay: uplayDetector
    }
  };
}