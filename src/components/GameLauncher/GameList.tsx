import React, { useState, useEffect } from 'react';
import { Gamepad2, Search, Filter, ChevronDown, AlertTriangle } from 'lucide-react';
import { gameScanner } from '../../lib/gameDetection/gameScanner';
import type { GameInfo } from '../../lib/gameDetection/types';

export const GameList: React.FC = () => {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Load games on mount
  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const { data, error } = await gameScanner.getInstalledGames();
      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to load games']);
    }
  };

  const scanForGames = async () => {
    setIsScanning(true);
    setErrors([]);
    
    try {
      const result = await gameScanner.scanForGames();
      if (result.errors.length > 0) {
        setErrors(result.errors);
      }
      await loadGames(); // Reload games after scan
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to scan for games']);
    } finally {
      setIsScanning(false);
    }
  };

  const handleLaunchGame = async (gameId: string) => {
    try {
      const isValid = await gameScanner.validateGameFiles(gameId);
      if (!isValid) {
        setErrors(['Game files are corrupted or missing. Please verify the installation.']);
        return;
      }
      await gameScanner.launchGame(gameId);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to launch game']);
    }
  };

  const filteredGames = games.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = platformFilter ? game.platform === platformFilter : true;
    return matchesSearch && matchesPlatform;
  });

  const platforms = Array.from(new Set(games.map(game => game.platform)));

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
          onClick={scanForGames}
          disabled={isScanning}
          className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-medium hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isScanning ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
              Scanning...
            </>
          ) : (
            'Scan for Games'
          )}
        </button>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-center text-red-400 mb-2">
            <AlertTriangle size={20} className="mr-2" />
            <h3 className="font-medium">Errors Found</h3>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-400">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty State */}
      {games.length === 0 && (
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
      {games.length > 0 && (
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
                
                <button
                  onClick={() => handleLaunchGame(game.id!)}
                  className="w-full py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-black font-medium transition-colors duration-150"
                >
                  Launch Game
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};