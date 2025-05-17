import React, { useState, useEffect } from 'react';
import { Gamepad2, Search, Filter, ChevronDown, AlertTriangle, Zap } from 'lucide-react';
import type { GameInfo } from '../../lib/gameDetection/types';
import { useGameScanner } from '../../hooks/useGameScanner';

export const GameList: React.FC = () => {
  const { games, isScanning, error, scanGames, launchGame, optimizeGame } = useGameScanner();
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [scanCompleted, setScanCompleted] = useState(false);

  // Filter games based on search and platform filter
  const filteredGames = React.useMemo(() => {
    if (!games || !Array.isArray(games)) {
      console.log('GameList: games não é um array válido', games);
      return [];
    }
    
    return games.filter(game => {
      const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlatform = platformFilter ? game.platform === platformFilter : true;
      return matchesSearch && matchesPlatform;
    });
  }, [games, searchQuery, platformFilter]);

  // Get unique platforms for the filter
  const platforms = React.useMemo(() => {
    if (!games || !Array.isArray(games)) {
      return [];
    }
    return Array.from(new Set(games.map(game => game.platform)));
  }, [games]);

  const handleScanForGames = async () => {
    console.log('Starting game scan...');
    setErrors([]);
    setScanCompleted(false);
    
    try {
      await scanGames();
      
      setScanCompleted(true);
      
      // Show success message for 3 seconds
      setTimeout(() => {
        setScanCompleted(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error during game scan:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to scan for games']);
    }
  };

  const handleLaunchGame = async (gameId: string) => {
    try {
      setErrors([]);
      console.log(`Launching game ${gameId}...`);
      
      await launchGame(gameId);
    } catch (error) {
      console.error('Error launching game:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to launch game']);
    }
  };

  const handleOptimizeGame = async (gameId: string) => {
    try {
      setErrors([]);
      setIsOptimizing(prev => ({ ...prev, [gameId]: true }));
      
      console.log(`Optimizing game ${gameId}...`);
      await optimizeGame(gameId);
    } catch (error) {
      console.error('Error optimizing game:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to optimize game']);
    } finally {
      setIsOptimizing(prev => ({ ...prev, [gameId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search games..."
            className="block w-full pl-10 pr-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-cyan-500 focus:outline-none focus:ring-0 text-gray-200 placeholder-gray-500"
          />
        </div>
        
        <div className="relative">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={18} className="text-gray-400" />
            </div>
            <select
              value={platformFilter || ''}
              onChange={(e) => setPlatformFilter(e.target.value || null)}
              className="appearance-none block w-full pl-10 pr-10 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-cyan-500 focus:outline-none focus:ring-0 text-gray-200"
            >
              <option value="">All Platforms</option>
              {platforms.map((platform) => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown size={18} className="text-gray-400" />
            </div>
          </div>
        </div>

        <button
          onClick={handleScanForGames}
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
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Scan Complete
            </>
          ) : (
            'Scan for Games'
          )}
        </button>
      </div>

      {/* Error Messages */}
      {(errors.length > 0 || error) && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-center text-red-400 mb-2">
            <AlertTriangle size={20} className="mr-2" />
            <h3 className="font-medium">Errors Found</h3>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {error && (
              <li className="text-sm text-red-400">{error}</li>
            )}
            {errors.map((errorMsg, index) => (
              <li key={index} className="text-sm text-red-400">{errorMsg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty State */}
      {(!games || games.length === 0) && (
        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-8 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-4">
            <Gamepad2 size={32} className="text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-white">No games found</h3>
          <p className="text-gray-400 text-center mt-2 max-w-md">
            Click the "Scan for Games" button to detect installed games on your system.
          </p>
        </div>
      )}

      {/* Games Grid */}
      {games && games.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => (
            <div 
              key={game.id}
              className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 hover:border-cyan-500/40 rounded-lg overflow-hidden transition-all duration-200 group"
            >
              <div className="h-40 relative overflow-hidden">
                {game.icon_url ? (
                  <img 
                    src={game.icon_url} 
                    alt={game.name} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                  />
                ) : (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <Gamepad2 size={48} className="text-gray-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-lg font-bold text-white">{game.name}</h3>
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-gray-400">{game.platform}</span>
                    {game.size && (
                      <>
                        <span className="mx-2 text-gray-600">•</span>
                        <span className="text-xs text-gray-400">{Math.round(game.size / 1024)} GB</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-gray-400">
                    Last played: {game.last_played ? new Date(game.last_played).toLocaleDateString() : 'Never'}
                  </div>
                  {game.optimized && (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                      Optimized
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {!game.optimized && (
                    <button
                      onClick={() => handleOptimizeGame(game.id!)}
                      disabled={isOptimizing[game.id!]}
                      className="flex-1 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isOptimizing[game.id!] ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                          Optimizing...
                        </>
                      ) : (
                        <>
                          <Zap size={14} className="mr-1" />
                          Optimize
                        </>
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleLaunchGame(game.id!)}
                    className={`${game.optimized ? 'w-full' : 'flex-1'} py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-black font-medium transition-colors duration-150`}
                  >
                    Launch Game
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};