import React, { useState, useEffect } from 'react';
import { Gamepad2, Search, Filter, ChevronDown, AlertTriangle, Zap } from 'lucide-react';
import type { GameInfo } from '../../lib/gameDetection/types';
import { useGameScanner } from '../../hooks/useGameScanner';

export const GameList: React.FC = () => {
  const { games, isScanning, error, scanGames, launchGame, optimizeGame, setGames, runDiagnostic } = useGameScanner();
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);

  // Add event listener for games-detected event
  useEffect(() => {
    // Function to receive games from the main process
    const handleGamesDetected = (event: any, detectedGames: GameInfo[]) => {
      console.log(`GameList: Recebidos ${detectedGames.length} jogos do processo principal via evento 'games-detected'`);
      
      // Update games in state if setGames is available
      if (typeof setGames === 'function') {
        setGames(detectedGames);
        console.log('GameList: Jogos atualizados no estado via evento games-detected');
      }
      
      // Save to localStorage for persistence
      try {
        localStorage.setItem('detected-games', JSON.stringify(detectedGames));
        console.log('GameList: Jogos salvos no localStorage');
      } catch (error) {
        console.error('GameList: Erro ao salvar jogos no localStorage:', error);
      }
    };
    
    // Register the listener
    if (window.ipcRenderer) {
      console.log('GameList: Registrando listener para event games-detected');
      window.ipcRenderer.on('games-detected', handleGamesDetected);
    }
    
    // Clean up listener when unmounting
    return () => {
      if (window.ipcRenderer) {
        console.log('GameList: Removendo listener para event games-detected');
        window.ipcRenderer.removeListener('games-detected', handleGamesDetected);
      }
    };
  }, [setGames]);

  // Log when games state changes
  useEffect(() => {
    console.log(`GameList: Rendering with ${games?.length || 0} games available`);
  }, [games]);

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

  const runGameDiagnostic = async () => {
    try {
      setIsDiagnosticRunning(true);
      console.log('GameList: Executando diagnóstico de detecção de jogos...');
      
      const result = await runDiagnostic();
      console.log('GameList: Resultado do diagnóstico:', result);
      setDiagnosticResults(result);
    } catch (error) {
      console.error('GameList: Erro ao executar diagnóstico:', error);
    } finally {
      setIsDiagnosticRunning(false);
    }
  };

  const handleScanForGames = async () => {
    console.log('GameList: Scan for Games button clicked');
    setErrors([]);
    setScanCompleted(false);
    
    try {
      const scannedGames = await scanGames();
      console.log(`GameList: Scan completed, received ${scannedGames?.length || 0} games`);
      
      setScanCompleted(true);
      
      // Show success message for 3 seconds
      setTimeout(() => {
        setScanCompleted(false);
      }, 3000);
      
    } catch (error) {
      console.error('GameList: Error during game scan:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to scan for games']);
    }
  };

  const handleLaunchGame = async (gameId: string) => {
    try {
      setErrors([]);
      console.log(`GameList: Launching game ${gameId}...`);
      
      await launchGame(gameId);
    } catch (error) {
      console.error('GameList: Error launching game:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to launch game']);
    }
  };

  const handleOptimizeGame = async (gameId: string) => {
    try {
      setErrors([]);
      setIsOptimizing(prev => ({ ...prev, [gameId]: true }));
      
      console.log(`GameList: Optimizing game ${gameId}...`);
      await optimizeGame(gameId);
    } catch (error) {
      console.error('GameList: Error optimizing game:', error);
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

      <div className="flex space-x-4">
        <button 
          onClick={runGameDiagnostic} 
          disabled={isDiagnosticRunning}
          className="px-4 py-2 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isDiagnosticRunning ? 'Diagnosticando...' : 'Diagnóstico de Detecção'}
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

      {diagnosticResults && (
        <div className="bg-gray-800 p-4 mt-4 rounded-lg overflow-auto max-h-96">
          <h3 className="text-white font-medium mb-3">Resultados do Diagnóstico</h3>
          <p className="text-gray-300 mb-4">
            Total de jogos detectados: <span className="font-bold text-cyan-400">{diagnosticResults.totalGames}</span>
          </p>
          
          {Object.entries(diagnosticResults.detailedResults).map(([platform, games]) => (
            <div key={platform} className="mb-4">
              <h4 className="text-white font-medium mb-2">
                {platform} ({(games as any[]).length} jogos)
              </h4>
              {(games as any[]).length > 0 ? (
                <ul className="space-y-2">
                  {(games as any[]).map((game, index) => (
                    <li key={index} className="bg-gray-700/50 p-2 rounded">
                      <div className="text-white font-medium">{game.name}</div>
                      <div className="text-gray-400 text-sm truncate">{game.installPath || game.executablePath}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">Nenhum jogo encontrado nesta plataforma</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}