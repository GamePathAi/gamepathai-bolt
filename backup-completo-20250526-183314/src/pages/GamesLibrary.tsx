import React, { useState } from 'react';
import { GameDetectionProvider } from '../components/GameDetection/GameDetectionProvider';
import { GameScanner } from '../components/GameDetection/GameScanner';
import { GameList } from '../components/GameDetection/GameList';
import { AlertCircle } from 'lucide-react';
import type { GameInfo } from '../lib/gameDetection/types';

export const GamesLibrary: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<GameInfo | null>(null);
  const [launchStatus, setLaunchStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleGameLaunch = async (game: GameInfo) => {
    try {
      console.log(`Launching game: ${game.name}`);
      // In a real implementation, this would use Electron to launch the game
      // For this example, we'll just simulate a successful launch
      setLaunchStatus({ success: true, message: `${game.name} launched successfully` });
      
      // Clear the status after 3 seconds
      setTimeout(() => {
        setLaunchStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Error launching game:', error);
      setLaunchStatus({ 
        success: false, 
        message: `Failed to launch ${game.name}: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  const handleGameOptimize = async (game: GameInfo) => {
    try {
      console.log(`Optimizing game: ${game.name}`);
      // In a real implementation, this would use Electron to optimize the game
      // For this example, we'll just simulate a successful optimization
      setLaunchStatus({ success: true, message: `${game.name} optimized successfully` });
      
      // Clear the status after 3 seconds
      setTimeout(() => {
        setLaunchStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Error optimizing game:', error);
      setLaunchStatus({ 
        success: false, 
        message: `Failed to optimize ${game.name}: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  return (
    <GameDetectionProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gray-800/60 backdrop-blur-sm border border-red-500/20 rounded-lg overflow-hidden p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Games Library</h1>
              <p className="text-gray-400 mt-1">
                Detected games ready for optimization
              </p>
            </div>
            <GameScanner compact />
          </div>
        </div>

        {/* Status Messages */}
        {launchStatus && (
          <div className={`bg-${launchStatus.success ? 'green' : 'red'}-500/10 border border-${launchStatus.success ? 'green' : 'red'}-500/50 rounded-lg p-4 flex items-start`}>
            <AlertCircle className={`text-${launchStatus.success ? 'green' : 'red'}-400 mr-3 mt-0.5 flex-shrink-0`} size={20} />
            <p className={`text-${launchStatus.success ? 'green' : 'red'}-400`}>{launchStatus.message}</p>
          </div>
        )}

        {/* Games List */}
        <GameList 
          onGameSelect={setSelectedGame}
          onGameLaunch={handleGameLaunch}
          onGameOptimize={handleGameOptimize}
        />
      </div>
    </GameDetectionProvider>
  );
};