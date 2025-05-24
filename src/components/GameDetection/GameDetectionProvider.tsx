import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGameDetection } from '../../hooks/useGameDetection';
import type { GameInfo, DetectorOptions } from '../../lib/gameDetection/types';

interface GameDetectionContextType {
  games: GameInfo[];
  isScanning: boolean;
  error: string | null;
  lastScanTime: Date | null;
  scanAllGames: (options?: DetectorOptions) => Promise<GameInfo[]>;
  scanPlatform: (platform: string, options?: DetectorOptions) => Promise<GameInfo[]>;
  clearCache: () => Promise<boolean>;
  platformCounts: Record<string, number>;
}

const GameDetectionContext = createContext<GameDetectionContextType | undefined>(undefined);

export const GameDetectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    games,
    isScanning,
    error,
    lastScanTime,
    scanAllPlatforms,
    scanPlatform,
    clearCache
  } = useGameDetection();

  const [platformCounts, setPlatformCounts] = useState<Record<string, number>>({});

  // Calculate platform counts whenever games change
  useEffect(() => {
    const counts: Record<string, number> = {};
    games.forEach(game => {
      const platform = game.platform;
      counts[platform] = (counts[platform] || 0) + 1;
    });
    setPlatformCounts(counts);
  }, [games]);

  // Expose the context value
  const contextValue: GameDetectionContextType = {
    games,
    isScanning,
    error,
    lastScanTime,
    scanAllGames: scanAllPlatforms,
    scanPlatform,
    clearCache,
    platformCounts
  };

  return (
    <GameDetectionContext.Provider value={contextValue}>
      {children}
    </GameDetectionContext.Provider>
  );
};

export const useGameDetectionContext = () => {
  const context = useContext(GameDetectionContext);
  if (context === undefined) {
    throw new Error('useGameDetectionContext must be used within a GameDetectionProvider');
  }
  return context;
};