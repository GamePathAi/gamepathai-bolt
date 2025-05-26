// useGameScanner.ts - VersÃ£o atualizada para usar window.electronAPI
import { useState, useEffect, useCallback } from 'react';
import type { GameInfo } from '../lib/gameDetection/types';
import { useGameStore } from '../stores/gameStore';

export interface Game extends GameInfo {
  id: string;
  name: string;
  platform: string;
  installPath?: string;
  executablePath?: string;
  size?: number;
  familyIcon?: string;
  cleanName?: string;
  gameFamily?: string;
  isMainGame?: boolean;
  optimized?: boolean;
}

export function useGameScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const { games, setGames, updateGame } = useGameStore();

  // Verificar se electronAPI estÃ¡ disponÃ­vel
  const isElectronAPIAvailable = useCallback(() => {
    const available = typeof window !== 'undefined' && 
                     window.electronAPI && 
                     typeof window.electronAPI === 'object';
    
    if (!available) {
      console.warn('useGameScanner: electronAPI nÃ£o disponÃ­vel');
    }
    
    return available;
  }, []);

  // Carregar jogos na inicializaÃ§Ã£o
  useEffect(() => {
    console.log('useGameScanner: Inicializando e carregando jogos');
    loadGames();

    // Configurar listeners para eventos do sistema
    if (isElectronAPIAvailable() && window.electronAPI?.events) {
      console.log('useGameScanner: Configurando listeners de eventos');

      // Listener para jogos detectados
      const handleGamesDetected = (detectedGames: Game[]) => {
        console.log(`useGameScanner: Recebidos ${detectedGames.length} jogos via evento`);
        
        if (Array.isArray(detectedGames) && detectedGames.length > 0) {
          setGames(detectedGames);
          console.log(`useGameScanner: Store atualizado com ${detectedGames.length} jogos`);
          
          // Salvar no localStorage
          try {
            localStorage.setItem('detected-games', JSON.stringify(detectedGames));
            console.log(`useGameScanner: ${detectedGames.length} jogos salvos no localStorage`);
          } catch (error) {
            console.error('useGameScanner: Erro ao salvar no localStorage:', error);
          }
        }
      };

      // Listener para jogo lanÃ§ado
      const handleGameLaunched = (data: { game: Game; result: any }) => {
        console.log('useGameScanner: Jogo lanÃ§ado:', data.game.name);
      };

      // Listener para sistema otimizado
      const handleSystemOptimized = (data: { profile: string }) => {
        console.log('useGameScanner: Sistema otimizado com perfil:', data.profile);
      };

      // Registrar listeners
      if (window.electronAPI?.events?.on) {
        window.electronAPI.events.on('games:detected', handleGamesDetected);
        window.electronAPI.events.on('game:launched', handleGameLaunched);
        window.electronAPI.events.on('system:optimized', handleSystemOptimized);
      }

      // Cleanup
      return () => {
        if (window.electronAPI?.events?.off) {
          console.log('useGameScanner: Removendo listeners de eventos');
          window.electronAPI.events.off('games:detected', handleGamesDetected);
          window.electronAPI.events.off('game:launched', handleGameLaunched);
          window.electronAPI.events.off('system:optimized', handleSystemOptimized);
        }
      };
    }
  }, [setGames, isElectronAPIAvailable]);

  // Carregar jogos (localStorage + API)
  const loadGames = async () => {
    try {
      console.log('useGameScanner: Carregando jogos do store/localStorage');
      setError(null);

      // Primeiro tentar carregar do localStorage
      try {
        const savedGames = localStorage.getItem('detected-games');
        if (savedGames) {
          const parsedGames = JSON.parse(savedGames);
          if (Array.isArray(parsedGames) && parsedGames.length > 0) {
            console.log(`useGameScanner: ${parsedGames.length} jogos carregados do localStorage`);
            setGames(parsedGames);
            return;
          }
        }
      } catch (storageError) {
        console.error('useGameScanner: Erro ao carregar do localStorage:', storageError);
      }

      // Se localStorage falhar, usar API do electronAPI
      if (isElectronAPIAvailable()) {
        console.log('useGameScanner: Carregando jogos via electronAPI');
        const result = await window.electronAPI!.scanGames();
        
        if (result.success && Array.isArray(result.data)) {
          console.log(`useGameScanner: ${result.data.length} jogos carregados via API`);
          setGames(result.data);
          
          // Salvar no localStorage
          try {
            localStorage.setItem('detected-games', JSON.stringify(result.data));
            console.log(`useGameScanner: ${result.data.length} jogos salvos no localStorage`);
          } catch (storageError) {
            console.error('useGameScanner: Erro ao salvar no localStorage:', storageError);
          }
        } else {
          console.log('useGameScanner: Nenhum jogo encontrado via API');
          setGames([]);
          setError(result.error || 'Nenhum jogo encontrado');
        }
      } else {
        console.warn('useGameScanner: electronAPI nÃ£o disponÃ­vel, usando jogos vazios');
        setGames([]);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Falha ao carregar jogos';
      setError(errorMsg);
      console.error('useGameScanner: Erro ao carregar jogos:', error);
    }
  };

  // Escanear jogos
  const scanGames = useCallback(async (): Promise<Game[]> => {
    if (isScanning) {
      console.log('useGameScanner: Escaneamento jÃ¡ em andamento');
      return [];
    }
    
    if (!isElectronAPIAvailable()) {
      const errorMsg = 'electronAPI nÃ£o disponÃ­vel para escaneamento';
      console.error('useGameScanner:', errorMsg);
      setError(errorMsg);
      return [];
    }
    
    console.log('useGameScanner: Iniciando escaneamento de jogos...');
    setIsScanning(true);
    setError(null);
    
    try {
      const result = await window.electronAPI!.scanGames();
      console.log('useGameScanner: Resultado do escaneamento:', result);
      
      if (result.success && Array.isArray(result.data)) {
        const detectedGames = result.data as Game[];
        console.log(`useGameScanner: Escaneamento bem-sucedido, ${detectedGames.length} jogos encontrados`);
        
        // Log detalhado dos jogos
        detectedGames.forEach((game, index) => {
          console.log(`${index + 1}. ${game.familyIcon || 'ðŸŽ®'} ${game.cleanName || game.name} (${game.platform})`);
        });
        
        setGames(detectedGames);
        setLastScanTime(new Date());
        
        // Salvar no localStorage
        try {
          localStorage.setItem('detected-games', JSON.stringify(detectedGames));
          console.log(`useGameScanner: ${detectedGames.length} jogos salvos no localStorage`);
        } catch (storageError) {
          console.error('useGameScanner: Erro ao salvar no localStorage:', storageError);
        }
        
        return detectedGames;
      } else {
        console.log('useGameScanner: Nenhum jogo encontrado no escaneamento');
        setError(result.error || 'Nenhum jogo encontrado');
        setLastScanTime(new Date());
        return [];
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Falha no escaneamento';
      setError(errorMsg);
      console.error('useGameScanner: Erro no escaneamento:', error);
      return [];
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, isElectronAPIAvailable, setGames]);

  // Escanear apenas Xbox
  const scanXboxGames = useCallback(async (): Promise<Game[]> => {
    if (!isElectronAPIAvailable()) {
      console.error('useGameScanner: electronAPI nÃ£o disponÃ­vel para Xbox');
      return [];
    }

    setIsScanning(true);
    setError(null);

    try {
      console.log('useGameScanner: Escaneando jogos Xbox...');
      
      const result = await window.electronAPI!.games.detectXbox();
      
      if (result.success && Array.isArray(result.data)) {
        const xboxGames = result.data as Game[];
        console.log(`useGameScanner: ${xboxGames.length} jogos Xbox encontrados`);
        
        // Adicionar ao store existente (manter outros jogos)
        const currentGames = games || [];
        const updatedGames = [...currentGames];
        
        xboxGames.forEach(xboxGame => {
          const existingIndex = updatedGames.findIndex(g => g.id === xboxGame.id);
          if (existingIndex >= 0) {
            updatedGames[existingIndex] = xboxGame;
          } else {
            updatedGames.push(xboxGame);
          }
        });
        
        setGames(updatedGames);
        
        return xboxGames;
      } else {
        console.error('useGameScanner: Erro no escaneamento Xbox:', result.error);
        setError(result.error || 'Erro no escaneamento Xbox');
        return [];
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro no escaneamento Xbox';
      console.error('useGameScanner: Erro no escaneamento Xbox:', error);
      setError(errorMsg);
      return [];
    } finally {
      setIsScanning(false);
    }
  }, [isElectronAPIAvailable, games, setGames]);

  // LanÃ§ar jogo
  const launchGame = useCallback(async (gameId: string, profile: string = 'balanced-fps'): Promise<boolean> => {
    if (!isElectronAPIAvailable()) {
      const errorMsg = 'electronAPI nÃ£o disponÃ­vel para lanÃ§amento';
      console.error('useGameScanner:', errorMsg);
      setError(errorMsg);
      return false;
    }

    setIsLaunching(true);
    setError(null);

    try {
      console.log(`useGameScanner: LanÃ§ando jogo ${gameId} com perfil ${profile}`);
      
      // Encontrar dados do jogo
      const game = games.find(g => g.id === gameId);
      if (!game) {
        console.error('useGameScanner: Jogo nÃ£o encontrado:', gameId);
        setError('Jogo nÃ£o encontrado');
        return false;
      }

      // Validar arquivos primeiro
      console.log(`useGameScanner: Validando arquivos do jogo ${game.name}`);
      const validation = await window.electronAPI!.games.validate(gameId);
      
      if (!validation.success) {
        console.error(`useGameScanner: ValidaÃ§Ã£o falhou para ${game.name}:`, validation.error);
        setError('Arquivos do jogo corrompidos ou ausentes. Verifique a instalaÃ§Ã£o.');
        return false;
      }

      // LanÃ§ar jogo
      console.log(`useGameScanner: LanÃ§ando ${game.name}...`);
      const result = await window.electronAPI!.launcher.launch(game, profile);
      
      if (result.success) {
        console.log(`useGameScanner: ${game.name} lanÃ§ado com sucesso`);
        return true;
      } else {
        console.error(`useGameScanner: Erro no lanÃ§amento de ${game.name}:`, result.error);
        setError(result.error || 'Erro no lanÃ§amento');
        return false;
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro no lanÃ§amento';
      console.error('useGameScanner: Erro no lanÃ§amento:', error);
      setError(errorMsg);
      return false;
    } finally {
      setIsLaunching(false);
    }
  }, [isElectronAPIAvailable, games]);

  // LanÃ§amento rÃ¡pido
  const quickLaunch = useCallback(async (gameId: string): Promise<boolean> => {
    if (!isElectronAPIAvailable()) {
      return false;
    }

    try {
      console.log(`useGameScanner: LanÃ§amento rÃ¡pido ${gameId}`);
      
      const result = await window.electronAPI!.launcher.quickLaunch(gameId);
      
      if (result.success) {
        console.log('useGameScanner: LanÃ§amento rÃ¡pido bem-sucedido');
        return true;
      } else {
        console.error('useGameScanner: Erro no lanÃ§amento rÃ¡pido:', result.error);
        setError(result.error || 'Erro no lanÃ§amento rÃ¡pido');
        return false;
      }
      
    } catch (error) {
      console.error('useGameScanner: Erro no lanÃ§amento rÃ¡pido:', error);
      return false;
    }
  }, [isElectronAPIAvailable]);

  // Otimizar jogo
  const optimizeGame = useCallback(async (gameId: string, profile: string = 'ultra-performance'): Promise<boolean> => {
    if (!isElectronAPIAvailable()) {
      const errorMsg = 'electronAPI nÃ£o disponÃ­vel para otimizaÃ§Ã£o';
      console.error('useGameScanner:', errorMsg);
      setError(errorMsg);
      return false;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      console.log(`useGameScanner: Otimizando jogo ${gameId} com perfil ${profile}`);
      
      // Encontrar dados do jogo
      const game = games.find(g => g.id === gameId);
      if (!game) {
        console.error('useGameScanner: Jogo nÃ£o encontrado para otimizaÃ§Ã£o:', gameId);
        setError('Jogo nÃ£o encontrado');
        return false;
      }

      const result = await window.electronAPI!.optimization.optimizeForGame(game, profile);
      
      if (result.success) {
        console.log(`useGameScanner: OtimizaÃ§Ã£o de ${game.name} concluÃ­da`);
        
        // Atualizar jogo no store
        updateGame(gameId, { optimized: true });
        
        // Atualizar no localStorage
        try {
          const savedGames = localStorage.getItem('detected-games');
          if (savedGames) {
            const parsedGames = JSON.parse(savedGames);
            const updatedGames = parsedGames.map((g: Game) => 
              g.id === gameId ? { ...g, optimized: true } : g
            );
            localStorage.setItem('detected-games', JSON.stringify(updatedGames));
            console.log(`useGameScanner: Status de otimizaÃ§Ã£o atualizado no localStorage para ${gameId}`);
          }
        } catch (storageError) {
          console.error('useGameScanner: Erro ao atualizar localStorage:', storageError);
        }
        
        return true;
      } else {
        console.error(`useGameScanner: Erro na otimizaÃ§Ã£o de ${game.name}:`, result.error);
        setError(result.error || 'Erro na otimizaÃ§Ã£o');
        return false;
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro na otimizaÃ§Ã£o';
      console.error('useGameScanner: Erro na otimizaÃ§Ã£o:', error);
      setError(errorMsg);
      return false;
    } finally {
      setIsOptimizing(false);
    }
  }, [isElectronAPIAvailable, games, updateGame]);

  // Otimizar sistema
  const optimizeSystem = useCallback(async (profile: string = 'balanced-fps'): Promise<boolean> => {
    if (!isElectronAPIAvailable()) {
      return false;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      console.log(`useGameScanner: Otimizando sistema com perfil ${profile}`);
      
      const result = await window.electronAPI!.optimization.optimizeSystem(profile);
      
      if (result.success) {
        console.log('useGameScanner: Sistema otimizado com sucesso');
        return true;
      } else {
        console.error('useGameScanner: Erro na otimizaÃ§Ã£o do sistema:', result.error);
        setError(result.error || 'Erro na otimizaÃ§Ã£o do sistema');
        return false;
      }
      
    } catch (error) {
      console.error('useGameScanner: Erro na otimizaÃ§Ã£o do sistema:', error);
      return false;
    } finally {
      setIsOptimizing(false);
    }
  }, [isElectronAPIAvailable]);

  // Carregar jogos do tray (compatibilidade)
  const loadGamesFromTray = useCallback(async (): Promise<Game[]> => {
    console.log('useGameScanner: Carregando jogos do tray (usando scan padrÃ£o)');
    
    // Usar scan padrÃ£o jÃ¡ que o tray usa a mesma fonte
    return await scanGames();
  }, [scanGames]);

  // DiagnÃ³stico
  const runDiagnostic = useCallback(async () => {
    console.log('useGameScanner: Executando diagnÃ³stico');
    
    if (!isElectronAPIAvailable()) {
      return { error: 'electronAPI nÃ£o disponÃ­vel' };
    }

    try {
      const result = await window.electronAPI!.monitoring.runDiagnostics();
      console.log('useGameScanner: Resultado do diagnÃ³stico:', result);
      return result;
    } catch (error) {
      console.error('useGameScanner: Erro no diagnÃ³stico:', error);
      return { error: error instanceof Error ? error.message : 'Falha no diagnÃ³stico' };
    }
  }, [isElectronAPIAvailable]);

  // Limpar cache
  const clearCache = useCallback(async (): Promise<boolean> => {
    if (!isElectronAPIAvailable()) {
      return false;
    }

    try {
      console.log('useGameScanner: Limpando cache...');
      
      const result = await window.electronAPI!.games.clearCache();
      
      if (result.success) {
        console.log('useGameScanner: Cache limpo com sucesso');
        // Limpar localStorage tambÃ©m
        localStorage.removeItem('detected-games');
        return true;
      } else {
        console.error('useGameScanner: Erro ao limpar cache:', result.error);
        return false;
      }
      
    } catch (error) {
      console.error('useGameScanner: Erro ao limpar cache:', error);
      return false;
    }
  }, [isElectronAPIAvailable]);

  // Testar API
  const testAPI = useCallback(async (): Promise<boolean> => {
    console.log('useGameScanner: Testando APIs...');
    
    if (!isElectronAPIAvailable()) {
      console.error('useGameScanner: electronAPI nÃ£o disponÃ­vel');
      return false;
    }

    try {
      // Testar scan
      const scanResult = await window.electronAPI!.scanGames();
      console.log('useGameScanner: Teste de scan:', scanResult.success);
      
      // Testar diagnÃ³stico
      const diagResult = await window.electronAPI!.monitoring.runDiagnostics();
      console.log('useGameScanner: Teste de diagnÃ³stico:', diagResult.success);
      
      const success = scanResult.success && diagResult.success;
      console.log(`useGameScanner: Teste geral ${success ? 'passou' : 'falhou'}`);
      
      return success;
      
    } catch (error) {
      console.error('useGameScanner: Erro nos testes:', error);
      return false;
    }
  }, [isElectronAPIAvailable]);

  return {
    // Estados
    games,
    isScanning,
    isLaunching,
    isOptimizing,
    error,
    lastScanTime,
    
    // FunÃ§Ãµes principais
    scanGames,
    scanXboxGames,
    launchGame,
    quickLaunch,
    optimizeGame,
    optimizeSystem,
    
    // FunÃ§Ãµes auxiliares
    loadGamesFromTray,
    runDiagnostic,
    clearCache,
    testAPI,
    
    // UtilitÃ¡rios
    setGames,
    isElectronAPIAvailable
  };
}