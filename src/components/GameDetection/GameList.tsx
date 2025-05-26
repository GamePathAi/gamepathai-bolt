import React, { useState, useEffect } from 'react';
import { useGameDetectionContext } from './GameDetectionProvider';
import { Gamepad2, Search, Filter, ChevronDown, Zap, Play, AlertTriangle } from 'lucide-react';
import type { GameInfo } from '../../lib/gameDetection/types';

interface GameListProps {
  onGameSelect?: (game: GameInfo) => void;
  onGameLaunch?: (game: GameInfo) => void;
  onGameOptimize?: (game: GameInfo) => void;
}

// Maximum number of games to display in the UI
const MAX_DISPLAYED_GAMES = 100;

export const GameList: React.FC<GameListProps> = ({ 
  onGameSelect, 
  onGameLaunch, 
  onGameOptimize 
}) => {
  const { games, isScanning, error, scanAllGames } = useGameDetectionContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'platform' | 'lastPlayed'>('lastPlayed');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isOptimizing, setIsOptimizing] = useState<Record<string, boolean>>({});
  const [isLaunching, setIsLaunching] = useState<Record<string, boolean>>({});
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [showAllGames, setShowAllGames] = useState(false);

  // Get unique platforms for the filter
  const platforms = React.useMemo(() => {
    if (!games || !Array.isArray(games)) {
      return [];
    }
    return Array.from(new Set(games.map(game => game.platform)));
  }, [games]);

  // Filter and sort games
  const filteredGames = React.useMemo(() => {
    if (!games || !Array.isArray(games)) {
      return [];
    }
    
    return games
      .filter(game => {
        const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlatform = platformFilter ? game.platform === platformFilter : true;
        return matchesSearch && matchesPlatform;
      })
      .sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'platform':
            comparison = a.platform.localeCompare(b.platform);
            break;
          case 'lastPlayed':
            // Convert dates to timestamps for comparison
            const aTime = a.last_played ? new Date(a.last_played).getTime() : 0;
            const bTime = b.last_played ? new Date(b.last_played).getTime() : 0;
            comparison = aTime - bTime;
            break;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [games, searchQuery, platformFilter, sortBy, sortDirection]);

  // Limit displayed games to prevent UI performance issues
  const displayedGames = React.useMemo(() => {
    if (showAllGames) {
      return filteredGames;
    }
    return filteredGames.slice(0, MAX_DISPLAYED_GAMES);
  }, [filteredGames, showAllGames]);

  const handleScanForGames = async () => {
    await scanAllGames({ forceRefresh: true });
  };

  const handleGameClick = (game: GameInfo) => {
    if (onGameSelect) {
      onGameSelect(game);
    }
  };

  const handleLaunchGame = async (e: React.MouseEvent, game: GameInfo) => {
    e.stopPropagation();
    
    if (!onGameLaunch) return;
    
    setIsLaunching(prev => ({ ...prev, [game.id]: true }));
    
    try {
      // If we're in Electron, try to launch the game using the Electron API
      if (window.electronAPI && game.executablePath) {
        await window.electronAPI.launchGame(game);
      }
      
      onGameLaunch(game);
    } catch (error) {
      console.error('Error launching game:', error);
    } finally {
      setIsLaunching(prev => ({ ...prev, [game.id]: false }));
    }
  };

  const handleOptimizeGame = async (e: React.MouseEvent, game: GameInfo) => {
    e.stopPropagation();
    
    if (!onGameOptimize) return;
    
    setIsOptimizing(prev => ({ ...prev, [game.id]: true }));
    
    try {
      onGameOptimize(game);
    } catch (error) {
      console.error('Error optimizing game:', error);
    } finally {
      setIsOptimizing(prev => ({ ...prev, [game.id]: false }));
    }
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const runGameDiagnostic = async () => {
    try {
      setIsDiagnosticRunning(true);
      console.log('GameList: Executando diagnÃ³stico de detecÃ§Ã£o de jogos...');
      
      if (window.electronAPI?.monitoring?.runDiagnostics) {
        const result = await window.electronAPI.monitoring.runDiagnostics();
        console.log('GameList: Resultado do diagnÃ³stico:', result);
        setDiagnosticResults(result.data);
      } else {
        console.warn('GameList: API de diagnÃ³stico nÃ£o disponÃ­vel');
        setDiagnosticResults({
          message: 'Diagnostic API not available in this environment'
        });
      }
    } catch (error) {
      console.error('GameList: Erro ao executar diagnÃ³stico:', error);
      setDiagnosticResults({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsDiagnosticRunning(false);
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

        <div className="relative">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'platform' | 'lastPlayed')}
              className="appearance-none block w-full pl-3 pr-10 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-cyan-500 focus:outline-none focus:ring-0 text-gray-200"
            >
              <option value="name">Sort by Name</option>
              <option value="platform">Sort by Platform</option>
              <option value="lastPlayed">Sort by Last Played</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown size={18} className="text-gray-400" />
            </div>
          </div>
        </div>

        <button
          onClick={toggleSortDirection}
          className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 hover:bg-gray-800 transition-colors"
        >
          {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
        </button>

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
          ) : (
            'Scan for Games'
          )}
        </button>
      </div>

      <div className="flex space-x-4">
        <button 
          onClick={runGameDiagnostic} 
          disabled={isDiagnosticRunning}
          className="px-4 py-2 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isDiagnosticRunning ? 'Diagnosticando...' : 'DiagnÃ³stico de DetecÃ§Ã£o'}
        </button>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-center text-red-400 mb-2">
            <AlertTriangle size={20} className="mr-2" />
            <h3 className="font-medium">Error Found</h3>
          </div>
          <p className="text-sm text-red-400">{error}</p>
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

      {/* Games Count Info */}
      {filteredGames.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Showing {displayedGames.length} of {filteredGames.length} games
          </div>
          {filteredGames.length > MAX_DISPLAYED_GAMES && !showAllGames && (
            <button
              onClick={() => setShowAllGames(true)}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Show all {filteredGames.length} games
            </button>
          )}
          {showAllGames && (
            <button
              onClick={() => setShowAllGames(false)}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Show only {MAX_DISPLAYED_GAMES} games
            </button>
          )}
        </div>
      )}

      {/* Games Grid */}
      {games && games.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedGames.map((game) => (
            <div 
              key={game.id}
              onClick={() => handleGameClick(game)}
              className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 hover:border-cyan-500/40 rounded-lg overflow-hidden transition-all duration-200 group cursor-pointer"
            >
              <div className="h-40 relative overflow-hidden">
                {game.icon_url ? (
                  <img 
                    src={game.icon_url} 
                    alt={game.name} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '';
                      e.currentTarget.parentElement?.classList.add('bg-gray-900', 'flex', 'items-center', 'justify-center');
                      e.currentTarget.replaceWith(
                        Object.assign(document.createElement('div'), {
                          className: 'flex items-center justify-center w-full h-full',
                          innerHTML: '<div class="text-gray-700"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 11h4a4 4 0 0 1 4 4v4H6z M14 11h4"/><rect width="20" height="14" x="2" y="3" rx="2"/></svg></div>'
                        })
                      );
                    }}
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
                        <span className="mx-2 text-gray-600">â€¢</span>
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
                  {!game.optimized && onGameOptimize && (
                    <button
                      onClick={(e) => handleOptimizeGame(e, game)}
                      disabled={isOptimizing[game.id]}
                      className="flex-1 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isOptimizing[game.id] ? (
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
                  
                  {onGameLaunch && (
                    <button
                      onClick={(e) => handleLaunchGame(e, game)}
                      disabled={isLaunching[game.id]}
                      className={`${game.optimized || !onGameOptimize ? 'w-full' : 'flex-1'} py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-black font-medium transition-colors duration-150 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed`}
                    >
                      {isLaunching[game.id] ? (
                        <>
                          <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin mr-1"></div>
                          Launching...
                        </>
                      ) : (
                        <>
                          <Play size={14} className="mr-1" />
                          Launch
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {diagnosticResults && (
        <div className="bg-gray-800 p-4 mt-4 rounded-lg overflow-auto max-h-96">
          <h3 className="text-white font-medium mb-3">Resultados do DiagnÃ³stico</h3>
          
          {diagnosticResults.systemInfo && (
            <div className="mb-4">
              <h4 className="text-cyan-400 text-sm font-medium mb-2">InformaÃ§Ãµes do Sistema</h4>
              <div className="bg-gray-900 p-3 rounded-lg">
                <pre className="text-xs text-gray-300 overflow-auto">
                  {JSON.stringify(diagnosticResults.systemInfo, null, 2)}
                </pre>
              </div>
            </div>
          )}
          
          {diagnosticResults.error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-400 text-sm">{diagnosticResults.error}</p>
            </div>
          )}
          
          {diagnosticResults.message && (
            <p className="text-gray-300">{diagnosticResults.message}</p>
          )}
        </div>
      )}
    </div>
  );
};