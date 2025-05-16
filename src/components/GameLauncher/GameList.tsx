import React, { useState, useEffect } from 'react';
import { Gamepad2, Search, Filter, ChevronDown, AlertTriangle, Zap } from 'lucide-react';
import type { GameInfo } from '../../lib/gameDetection/types';

// Interface para comunicação com o Electron
interface ElectronAPI {
  getInstalledGames: () => Promise<GameInfo[]>;
  scanGames: () => Promise<{ success: boolean; errors: string[] }>;
  validateGameFiles: (gameId: string) => Promise<boolean>;
  launchGame: (gameId: string) => Promise<boolean>;
  optimizeGame: (gameId: string) => Promise<boolean>;
}

// Função segura para acessar a API do Electron
const electron = (): ElectronAPI | null => {
  if (typeof window !== 'undefined' && window.electron) {
    return window.electron as unknown as ElectronAPI;
  }
  return null;
};

// Implementar um scanner mock para desenvolvimento sem Electron
const mockGameScanner = {
  getInstalledGames: async (): Promise<{ data: GameInfo[] | null; error: Error | null }> => {
    // Dados mockados para desenvolvimento
    const mockGames: GameInfo[] = [
      {
        id: 'cs2',
        name: 'Counter-Strike 2',
        platform: 'Steam',
        installPath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike 2',
        size: 35 * 1024, // 35 GB em MB
        icon_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg',
      },
      {
        id: 'cyberpunk',
        name: 'Cyberpunk 2077',
        platform: 'Steam',
        installPath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Cyberpunk 2077',
        size: 100 * 1024, // 100 GB em MB
        icon_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg',
      },
      {
        id: 'fortnite',
        name: 'Fortnite',
        platform: 'Epic',
        installPath: 'C:\\Program Files\\Epic Games\\Fortnite',
        size: 26 * 1024, // 26 GB em MB
        icon_url: 'https://cdn2.unrealengine.com/24br-s24-egs-launcher-productart-1920x1080-1920x1080-ec04a20bd189.jpg',
      },
      {
        id: 'lol',
        name: 'League of Legends',
        platform: 'Riot',
        installPath: 'C:\\Riot Games\\League of Legends',
        size: 15 * 1024, // 15 GB em MB
        icon_url: 'https://www.leagueoflegends.com/static/open-graph-2e582ae9fae8b0b396ca46ff21fd47a8.jpg',
      }
    ];
    
    // Simular um pequeno atraso de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: mockGames, error: null };
  },
  
  scanForGames: async (): Promise<{ success: boolean; errors: string[] }> => {
    // Simular um scan
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { success: true, errors: [] };
  },
  
  validateGameFiles: async (): Promise<boolean> => {
    return true;
  },
  
  launchGame: async (): Promise<boolean> => {
    console.log('Mock: Game would be launched if in Electron');
    return true;
  },
  
  optimizeGame: async (gameId: string): Promise<boolean> => {
    console.log(`Mock: Game ${gameId} would be optimized if in Electron`);
    return true;
  }
};

// Definir o game scanner real ou mock baseado na disponibilidade do Electron
const gameScanner = {
  getInstalledGames: async (): Promise<{ data: GameInfo[] | null; error: Error | null }> => {
    try {
      const api = electron();
      if (api) {
        // Estamos no Electron
        const games = await api.getInstalledGames();
        return { data: games, error: null };
      } else {
        // Estamos em ambiente de desenvolvimento sem Electron
        return await mockGameScanner.getInstalledGames();
      }
    } catch (error) {
      console.error('Error getting installed games:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  },
  
  scanForGames: async (): Promise<{ success: boolean; errors: string[] }> => {
    try {
      const api = electron();
      if (api) {
        // Estamos no Electron
        return await api.scanGames();
      } else {
        // Estamos em ambiente de desenvolvimento sem Electron
        return await mockGameScanner.scanForGames();
      }
    } catch (error) {
      console.error('Error scanning for games:', error);
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error during scan'] 
      };
    }
  },
  
  validateGameFiles: async (gameId: string): Promise<boolean> => {
    try {
      const api = electron();
      if (api) {
        // Estamos no Electron
        return await api.validateGameFiles(gameId);
      } else {
        // Estamos em ambiente de desenvolvimento sem Electron
        return await mockGameScanner.validateGameFiles(gameId);
      }
    } catch (error) {
      console.error('Error validating game files:', error);
      return false;
    }
  },
  
  launchGame: async (gameId: string): Promise<boolean> => {
    try {
      const api = electron();
      if (api) {
        // Estamos no Electron
        return await api.launchGame(gameId);
      } else {
        // Estamos em ambiente de desenvolvimento sem Electron
        return await mockGameScanner.launchGame(gameId);
      }
    } catch (error) {
      console.error('Error launching game:', error);
      throw error;
    }
  },
  
  optimizeGame: async (gameId: string): Promise<boolean> => {
    try {
      const api = electron();
      if (api) {
        // Estamos no Electron
        return await api.optimizeGame(gameId);
      } else {
        // Estamos em ambiente de desenvolvimento sem Electron
        return await mockGameScanner.optimizeGame(gameId);
      }
    } catch (error) {
      console.error('Error optimizing game:', error);
      throw error;
    }
  }
};

export const GameList: React.FC = () => {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [scanCompleted, setScanCompleted] = useState(false);

  // Load games on mount
  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setErrors([]);
      const { data, error } = await gameScanner.getInstalledGames();
      if (error) throw error;
      if (data) {
        console.log('Loaded games:', data);
        setGames(data);
      }
    } catch (error) {
      console.error('Error loading games:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to load games']);
    }
  };

  const scanForGames = async () => {
    console.log('Starting game scan...');
    setIsScanning(true);
    setErrors([]);
    setScanCompleted(false);
    
    try {
      const result = await gameScanner.scanForGames();
      console.log('Scan result:', result);
      
      if (result.errors.length > 0) {
        setErrors(result.errors);
      }
      
      // Always reload games after scan, even if there were errors
      await loadGames();
      setScanCompleted(true);
      
      // Show success message for 3 seconds
      setTimeout(() => {
        setScanCompleted(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error during game scan:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to scan for games']);
    } finally {
      setIsScanning(false);
    }
  };

  const handleLaunchGame = async (gameId: string) => {
    try {
      setErrors([]);
      console.log(`Launching game ${gameId}...`);
      
      const isValid = await gameScanner.validateGameFiles(gameId);
      if (!isValid) {
        setErrors(['Game files are corrupted or missing. Please verify the installation.']);
        return;
      }
      
      await gameScanner.launchGame(gameId);
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
      const result = await gameScanner.optimizeGame(gameId);
      
      if (result) {
        // Update the game as optimized
        setGames(prev => prev.map(game => 
          game.id === gameId ? { ...game, optimized: true } : game
        ));
      }
    } catch (error) {
      console.error('Error optimizing game:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to optimize game']);
    } finally {
      setIsOptimizing(prev => ({ ...prev, [gameId]: false }));
    }
  };

  // Filter games based on search and platform filter
  const filteredGames = React.useMemo(() => {
    return games.filter(game => {
      const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlatform = platformFilter ? game.platform === platformFilter : true;
      return matchesSearch && matchesPlatform;
    });
  }, [games, searchQuery, platformFilter]);

  // Get unique platforms for the filter
  const platforms = React.useMemo(() => {
    return Array.from(new Set(games.map(game => game.platform)));
  }, [games]);

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