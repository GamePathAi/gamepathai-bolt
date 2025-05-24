import React, { useState } from 'react';
import { useGameDetectionContext } from './GameDetectionProvider';
import { Gamepad2, Search, RefreshCw, AlertTriangle, Zap } from 'lucide-react';

interface GameScannerProps {
  onScanComplete?: (games: any[]) => void;
  compact?: boolean;
}

export const GameScanner: React.FC<GameScannerProps> = ({ onScanComplete, compact = false }) => {
  const { isScanning, error, scanAllGames, platformCounts, lastScanTime } = useGameDetectionContext();
  const [scanCompleted, setScanCompleted] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const handleScan = async () => {
    try {
      setScanCompleted(false);
      setScanProgress(0);
      
      // Start progress animation
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 95) {
            return 95; // Cap at 95% until complete
          }
          return prev + (Math.random() * 5);
        });
      }, 200);
      
      const games = await scanAllGames({ forceRefresh: true });
      
      clearInterval(interval);
      setScanProgress(100);
      
      if (onScanComplete) {
        onScanComplete(games);
      }
      
      setScanCompleted(true);
      
      // Reset the completed status after 3 seconds
      setTimeout(() => {
        setScanCompleted(false);
        setScanProgress(0);
      }, 3000);
    } catch (err) {
      console.error('Error scanning for games:', err);
      clearInterval(interval);
      setScanProgress(0);
    }
  };

  const totalGames = Object.values(platformCounts).reduce((sum, count) => sum + count, 0);

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="px-3 py-1.5 rounded-md bg-cyan-500 text-black text-sm font-medium hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isScanning ? (
            <>
              <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin mr-1"></div>
              Scanning...
            </>
          ) : scanCompleted ? (
            <>
              <RefreshCw size={14} className="mr-1" />
              Scan Complete
            </>
          ) : (
            <>
              <Search size={14} className="mr-1" />
              Scan Games
            </>
          )}
        </button>
        
        {totalGames > 0 && (
          <span className="text-xs text-gray-400">
            {totalGames} games found
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-white flex items-center">
            <Gamepad2 className="mr-2 text-gray-400" size={20} />
            Game Scanner
          </h2>
          {lastScanTime && (
            <p className="text-sm text-gray-400">
              Last scan: {lastScanTime.toLocaleString()}
            </p>
          )}
        </div>
        
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-medium hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isScanning ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
              Scanning...
            </>
          ) : scanCompleted ? (
            <>
              <Zap size={18} className="mr-2" />
              Scan Complete
            </>
          ) : (
            <>
              <Search size={18} className="mr-2" />
              Scan for Games
            </>
          )}
        </button>
      </div>
      
      {/* Progress Bar */}
      {(isScanning || scanProgress > 0) && (
        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
          <div 
            className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${scanProgress}%` }}
          ></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-center text-red-400 mb-2">
            <AlertTriangle size={20} className="mr-2" />
            <h3 className="font-medium">Error Scanning Games</h3>
          </div>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      
      {totalGames > 0 && (
        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-3">Detected Games</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(platformCounts).map(([platform, count]) => (
              <div key={platform} className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">{platform}</div>
                <div className="text-lg font-medium text-white">{count}</div>
              </div>
            ))}
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-xs text-gray-400">Total</div>
              <div className="text-lg font-medium text-cyan-400">{totalGames}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};