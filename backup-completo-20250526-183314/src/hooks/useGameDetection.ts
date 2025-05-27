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

  // Load cached games on mount
  useEffect(() => {
    const loadCachedGames = async () => {
      try {
        const cachedGames = await getItem<GameInfo[]>('detected-games');
        if (cachedGames && cachedGames.length > 0) {
          setAllGames(cachedGames);
        }
      } catch (error) {
        console.error('Error loading cached games:', error);
      }
    };

    loadCachedGames();
  }, [getItem]);

  // Scan for games on all platforms
  const scanAllPlatforms = useCallback(async (options: DetectorOptions = {}) => {
    if (isScanning) return;

    setIsScanning(true);
    setError(null);

    try {
      // Check if we should use cache
      if (!options.forceRefresh) {
        const cachedGames = await getItem<GameInfo[]>('detected-games');
        const cachedTime = await getItem<string>('last-scan-time');
        
        if (cachedGames && cachedGames.length > 0 && cachedTime) {
          const lastScan = new Date(cachedTime);
          const now = new Date();
          const timeDiff = now.getTime() - lastScan.getTime();
          
          // Use cache if it's less than 1 hour old
          if (timeDiff < 60 * 60 * 1000) {
            setAllGames(cachedGames);
            setLastScanTime(lastScan);
            setIsScanning(false);
            return cachedGames;
          }
        }
      }

      // Run all detectors in parallel
      const detectionPromises = [
        steamDetector.detect(options),
        epicDetector.detect(options),
        xboxDetector.detect(options),
        originDetector.detect(options),
        battleNetDetector.detect(options),
        gogDetector.detect(options),
        uplayDetector.detect(options)
      ];

      // Set timeout for each detector if specified
      const timeout = options.timeout || 30000; // Default 30 seconds
      const timeoutPromises = detectionPromises.map(promise => {
        return Promise.race([
          promise,
          new Promise<DetectionResult>((_, reject) => 
            setTimeout(() => reject(new Error('Detector timed out')), timeout)
          )
        ]);
      });

      // Wait for all detectors to complete or timeout
      const results = await Promise.allSettled(timeoutPromises);
      
      // Process results
      const detectionResults: DetectionResult[] = [];
      const allDetectedGames: GameInfo[] = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          detectionResults.push(result.value);
          allDetectedGames.push(...result.value.games);
        } else {
          const platforms = ['Steam', 'Epic', 'Xbox', 'Origin', 'Battle.net', 'GOG', 'Ubisoft Connect'];
          detectionResults.push({
            platform: platforms[index],
            games: [],
            error: result.reason?.message || 'Unknown error'
          });
        }
      });

      // Deduplicate games by ID
      const uniqueGames = allDetectedGames.reduce((acc, game) => {
        if (!acc.some(g => g.id === game.id)) {
          acc.push(game);
        }
        return acc;
      }, [] as GameInfo[]);

      // Update state
      setResults(detectionResults);
      setAllGames(uniqueGames);
      
      // Cache results
      const now = new Date();
      setLastScanTime(now);
      await setItem('detected-games', uniqueGames);
      await setItem('last-scan-time', now.toISOString());
      
      return uniqueGames;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during game detection';
      setError(errorMessage);
      console.error('Game detection error:', error);
      return [];
    } finally {
      setIsScanning(false);
    }
  }, [
    isScanning, 
    getItem, 
    setItem, 
    steamDetector, 
    epicDetector, 
    xboxDetector, 
    originDetector, 
    battleNetDetector, 
    gogDetector, 
    uplayDetector
  ]);

  // Scan for games on a specific platform
  const scanPlatform = useCallback(async (platform: string, options: DetectorOptions = {}) => {
    if (isScanning) return [];

    setIsScanning(true);
    setError(null);

    try {
      let detector;
      switch (platform.toLowerCase()) {
        case 'steam':
          detector = steamDetector;
          break;
        case 'epic':
          detector = epicDetector;
          break;
        case 'xbox':
          detector = xboxDetector;
          break;
        case 'origin':
          detector = originDetector;
          break;
        case 'battle.net':
          detector = battleNetDetector;
          break;
        case 'gog':
          detector = gogDetector;
          break;
        case 'ubisoft':
        case 'uplay':
          detector = uplayDetector;
          break;
        default:
          throw new Error(`Unknown platform: ${platform}`);
      }

      const result = await detector.detect(options);
      
      // Update all games with the new platform games
      setAllGames(prevGames => {
        // Remove existing games from this platform
        const filteredGames = prevGames.filter(game => game.platform !== result.platform);
        // Add new games from this platform
        return [...filteredGames, ...result.games];
      });
      
      // Update cache
      const updatedGames = [...allGames.filter(game => game.platform !== result.platform), ...result.games];
      await setItem('detected-games', updatedGames);
      
      return result.games;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Error detecting games on ${platform}`;
      setError(errorMessage);
      console.error(`Error detecting games on ${platform}:`, error);
      return [];
    } finally {
      setIsScanning(false);
    }
  }, [
    isScanning, 
    allGames, 
    setItem, 
    steamDetector, 
    epicDetector, 
    xboxDetector, 
    originDetector, 
    battleNetDetector, 
    gogDetector, 
    uplayDetector
  ]);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      await setItem('detected-games', null);
      await setItem('last-scan-time', null);
      setAllGames([]);
      setResults([]);
      setLastScanTime(null);
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }, [setItem]);

  return {
    games: allGames,
    results,
    isScanning,
    error,
    lastScanTime,
    scanAllPlatforms,
    scanPlatform,
    clearCache
  };
}