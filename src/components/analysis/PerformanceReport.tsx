import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  Activity, 
  Gamepad2, 
  Clock, 
  Target,
  Zap,
  Cpu,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  Play,
  Square,
  RefreshCw,
  Award,
  Settings,
  Flame,
  Monitor,
  Gauge,
  Trash2
} from 'lucide-react';

// Types
interface GameProcess {
  name: string;
  process: string;
  pid: number;
  memory: number;
  cpu?: number;
  isRunning: boolean;
}

interface PerformanceMetrics {
  timestamp: string;
  fps: number;
  cpuUsage: number;
  gpuUsage: number;
  ramUsage: number;
  cpuTemp: number;
  gpuTemp: number;
}

interface GameSession {
  id: string;
  gameName: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  avgFps: number;
  maxFps: number;
  minFps: number;
  isActive: boolean;
}

interface PerformanceData {
  currentMetrics: PerformanceMetrics;
  runningGames: GameProcess[];
  historicalData: PerformanceMetrics[];
  activeSessions: GameSession[];
  completedSessions: GameSession[];
  recommendations: string[];
  systemScore: number;
  isCollecting: boolean;
}

interface DetectedGame {
  id: string;
  name: string;
  platform: string;
  installPath?: string;
  executablePath?: string;
  appId?: string;
}

const PerformanceReport = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'sessions' | 'analysis'>('overview');
  const [showOptimizations, setShowOptimizations] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [detectedGames, setDetectedGames] = useState<DetectedGame[]>([]);

  // Verificar se estamos no Electron
  const isElectron = typeof window !== 'undefined' && window.electronAPI && window.electronAPI.performanceAPI;

  // Carregar dados do sistema - usando useCallback para evitar re-renders desnecessários
  const loadPerformanceData = useCallback(async () => {
    if (!isElectron) {
      // Modo desenvolvimento - usar dados mock
      console.log('Modo desenvolvimento - usando dados simulados');
      setPerformanceData(generateMockData());
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await window.electronAPI.performanceAPI.getData();
      console.log('📊 Dados carregados:', data);
      setPerformanceData(data);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados de performance');
      // Usar dados mock em caso de erro
      setPerformanceData(generateMockData());
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [isElectron]);

  // Gerar dados mock para desenvolvimento
  const generateMockData = useCallback((): PerformanceData => {
    const isGameRunning = Math.random() > 0.5;
    return {
      currentMetrics: {
        timestamp: new Date().toISOString(),
        fps: isGameRunning ? 90 + Math.random() * 40 : 60,
        cpuUsage: 20 + Math.random() * 40,
        gpuUsage: isGameRunning ? 40 + Math.random() * 40 : 10 + Math.random() * 20,
        ramUsage: 40 + Math.random() * 30,
        cpuTemp: 45 + Math.random() * 20,
        gpuTemp: 40 + Math.random() * 25
      },
      runningGames: isGameRunning ? [{
        name: 'Counter-Strike 2',
        process: 'cs2.exe',
        pid: 12345,
        memory: 2048,
        cpu: 15,
        isRunning: true
      }] : [],
      historicalData: Array.from({ length: 20 }, (_, i) => ({
        timestamp: new Date(Date.now() - (20 - i) * 2000).toISOString(),
        fps: 60 + Math.random() * 60,
        cpuUsage: 20 + Math.random() * 40,
        gpuUsage: 10 + Math.random() * 50,
        ramUsage: 40 + Math.random() * 30,
        cpuTemp: 45 + Math.random() * 20,
        gpuTemp: 40 + Math.random() * 25
      })),
      activeSessions: [],
      completedSessions: [],
      recommendations: [
        '🔥 Performance detectada',
        '⚡ Sistema funcionando bem',
        '💡 Temperaturas normais'
      ],
      systemScore: 85,
      isCollecting: Math.random() > 0.5
    };
  }, []);

  // Iniciar coleta - VERSÃO EXTREMAMENTE ROBUSTA COM LOGS
  const startCollection = useCallback(async () => {
    console.log('🚀 startCollection chamado - Iniciando coleta...');
    setActionLoading('start');
    
    if (!isElectron) {
      console.log('📱 Modo desenvolvimento - simulando início da coleta');
      setPerformanceData(prev => prev ? { ...prev, isCollecting: true } : null);
      setActionLoading(null);
      return;
    }

    try {
      console.log('⚡ Chamando window.electronAPI.performanceAPI.startCollection()');
      const result = await window.electronAPI.performanceAPI.startCollection();
      console.log('✅ Coleta iniciada com sucesso:', result);
      
      // Múltiplas tentativas de atualização para garantir
      await loadPerformanceData();
      setTimeout(() => loadPerformanceData(), 500);
      setTimeout(() => loadPerformanceData(), 1000);
      setTimeout(() => loadPerformanceData(), 2000);
      
    } catch (err) {
      console.error('❌ Erro ao iniciar coleta:', err);
      setError('Erro ao iniciar coleta: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  }, [isElectron, loadPerformanceData]);

  // Parar coleta - VERSÃO EXTREMAMENTE ROBUSTA COM LOGS
  const stopCollection = useCallback(async () => {
    console.log('⏹️ stopCollection chamado - Parando coleta...');
    setActionLoading('stop');
    
    if (!isElectron) {
      console.log('📱 Modo desenvolvimento - simulando parada da coleta');
      setPerformanceData(prev => prev ? { ...prev, isCollecting: false } : null);
      setActionLoading(null);
      return;
    }

    try {
      console.log('⚡ Chamando window.electronAPI.performanceAPI.stopCollection()');
      const result = await window.electronAPI.performanceAPI.stopCollection();
      console.log('✅ Coleta parada com sucesso:', result);
      
      // Múltiplas tentativas de atualização para garantir
      await loadPerformanceData();
      setTimeout(() => loadPerformanceData(), 500);
      setTimeout(() => loadPerformanceData(), 1000);
      setTimeout(() => loadPerformanceData(), 2000);
      
    } catch (err) {
      console.error('❌ Erro ao parar coleta:', err);
      setError('Erro ao parar coleta: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  }, [isElectron, loadPerformanceData]);

  // Limpar dados - CORRIGIDO COM LOGS
  const clearData = useCallback(async () => {
    if (!window.confirm('Deseja limpar todos os dados de performance?')) {
      return;
    }
    
    console.log('🗑️ clearData chamado - Limpando dados...');
    setActionLoading('clear');
    
    if (!isElectron) {
      console.log('📱 Modo desenvolvimento - simulando limpeza');
      setPerformanceData(generateMockData());
      setActionLoading(null);
      return;
    }

    try {
      console.log('⚡ Chamando window.electronAPI.performanceAPI.clearData()');
      await window.electronAPI.performanceAPI.clearData();
      console.log('✅ Dados limpos com sucesso');
      await loadPerformanceData();
    } catch (err) {
      console.error('❌ Erro ao limpar dados:', err);
      setError('Erro ao limpar dados: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  }, [isElectron, loadPerformanceData, generateMockData]);

  // Atualizar dados - CORRIGIDO COM LOGS
  const refreshData = useCallback(async () => {
    console.log('🔄 refreshData chamado - Atualizando dados...');
    setIsRefreshing(true);
    await loadPerformanceData();
  }, [loadPerformanceData]);

  // Carregar dados iniciais
  useEffect(() => {
    console.log('🔧 Componente montado, carregando dados iniciais...');
    loadPerformanceData();
  }, [loadPerformanceData]);

  // Atualizar dados periodicamente se estiver coletando - CORRIGIDO
  useEffect(() => {
    if (!performanceData?.isCollecting) {
      console.log('⏸️ Coleta parada, não atualizando automaticamente');
      return;
    }

    console.log('🔄 Iniciando atualização automática (coleta ativa)');
    const interval = setInterval(() => {
      console.log('📊 Atualizando dados automaticamente...');
      loadPerformanceData();
    }, 2000);

    return () => {
      console.log('🛑 Parando atualização automática');
      clearInterval(interval);
    };
  }, [performanceData?.isCollecting, loadPerformanceData]);

  // Carregar jogos detectados do localStorage
  useEffect(() => {
    const loadDetectedGames = () => {
      try {
        const savedGames = localStorage.getItem('detected-games');
        if (savedGames) {
          const games: DetectedGame[] = JSON.parse(savedGames);
          setDetectedGames(games);
          console.log(`✅ PerformanceReport carregou ${games.length} jogos do localStorage`);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar jogos detectados:', error);
      }
    };

    loadDetectedGames();

    // Escutar mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'detected-games') {
        loadDetectedGames();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Funções auxiliares
  const getPerformanceColor = (value: number, type: 'fps' | 'usage' | 'temp') => {
    switch (type) {
      case 'fps':
        if (value >= 90) return 'text-green-400';
        if (value >= 60) return 'text-yellow-400';
        return 'text-red-400';
      case 'usage':
        if (value <= 50) return 'text-green-400';
        if (value <= 75) return 'text-yellow-400';
        return 'text-red-400';
      case 'temp':
        if (value <= 65) return 'text-green-400';
        if (value <= 80) return 'text-yellow-400';
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-green-500 to-green-600';
    if (score >= 75) return 'from-yellow-500 to-yellow-600';
    if (score >= 60) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const navigateToGamesLibrary = () => {
    window.location.href = '/app/games';
  };

  // Estados de carregamento
  if (loading) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white">Carregando análise de performance...</p>
        </div>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
          <p className="text-white">Erro ao carregar dados</p>
          <button
            onClick={loadPerformanceData}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <Activity className="w-7 h-7 text-purple-400" />
                Performance Analysis
                {performanceData.isCollecting && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-green-400">Coletando</span>
                  </div>
                )}
              </h2>
              <p className="text-gray-400">
                {isElectron ? 'Monitoramento em tempo real do sistema' : 'Modo desenvolvimento - Dados simulados'}
              </p>
              {error && (
                <p className="text-red-400 text-sm mt-1">{error}</p>
              )}
            </div>
            
            {/* System Score */}
            <div className={`bg-gradient-to-r ${getScoreColor(performanceData.systemScore)} p-4 rounded-xl shadow-lg`}>
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-white" />
                <div>
                  <div className="text-3xl font-bold text-white">
                    {performanceData.systemScore}%
                  </div>
                  <div className="text-xs text-white/80">System Score</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 relative z-20">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔄 Botão Atualizar clicado!');
                refreshData();
              }}
              disabled={isRefreshing || actionLoading !== null}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('⚙️ Botão Otimizações clicado!');
                setShowOptimizations(prev => !prev);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Otimizações
            </button>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🎯 Botão Start/Stop clicado! isCollecting:', performanceData.isCollecting);
                performanceData.isCollecting ? stopCollection() : startCollection();
              }}
              disabled={actionLoading !== null}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50 ${
                performanceData.isCollecting
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {actionLoading === 'start' || actionLoading === 'stop' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {actionLoading === 'start' ? 'Iniciando...' : 'Parando...'}
                </>
              ) : performanceData.isCollecting ? (
                <>
                  <Square className="w-4 h-4" />
                  Parar Coleta
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Iniciar Coleta
                </>
              )}
            </button>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🗑️ Botão Limpar clicado!');
                clearData();
              }}
              disabled={actionLoading !== null}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {actionLoading === 'clear' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {actionLoading === 'clear' ? 'Limpando...' : 'Limpar'}
            </button>
          </div>
        </div>
      </div>

      {/* Optimization Tips */}
      {showOptimizations && (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              Dicas de Otimização
            </h3>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('❌ Fechando otimizações');
                setShowOptimizations(false);
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Ative o Modo Game no Windows para melhor performance',
              'Desative programas em segundo plano desnecessários',
              'Configure prioridade alta para jogos no Gerenciador de Tarefas',
              'Atualize drivers da GPU regularmente',
              'Use o FPS Booster para otimizações automáticas',
              'Configure perfil de Alta Performance nas configurações de energia'
            ].map((tip, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg">
                <Zap className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-gray-800 p-1 rounded-lg relative z-10">
        <div className="flex space-x-1">
          {[
            { id: 'overview', label: 'Visão Geral', icon: Monitor },
            { id: 'games', label: 'Jogos', icon: Gamepad2 },
            { id: 'sessions', label: 'Sessões', icon: Clock },
            { id: 'analysis', label: 'Análise', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`🟣 Tab ${tab.label} [${tab.id}] clicado!`);
                setActiveTab(tab.id as any);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded transition-all relative z-30 ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="relative z-10">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Current Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-green-500 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-600 rounded-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-2xl font-bold ${getPerformanceColor(performanceData.currentMetrics.fps, 'fps')}`}>
                    {Math.round(performanceData.currentMetrics.fps)}
                  </span>
                </div>
                <h3 className="text-white font-medium">FPS</h3>
                <p className="text-gray-400 text-sm">Frames por segundo</p>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-600 rounded-lg">
                    <Cpu className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-2xl font-bold ${getPerformanceColor(performanceData.currentMetrics.cpuUsage, 'usage')}`}>
                    {Math.round(performanceData.currentMetrics.cpuUsage)}%
                  </span>
                </div>
                <h3 className="text-white font-medium">CPU</h3>
                <p className={`text-sm ${getPerformanceColor(performanceData.currentMetrics.cpuTemp, 'temp')}`}>
                  {Math.round(performanceData.currentMetrics.cpuTemp)}°C
                </p>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-purple-500 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-600 rounded-lg">
                    <Gauge className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-2xl font-bold ${getPerformanceColor(performanceData.currentMetrics.gpuUsage, 'usage')}`}>
                    {Math.round(performanceData.currentMetrics.gpuUsage)}%
                  </span>
                </div>
                <h3 className="text-white font-medium">GPU</h3>
                <p className={`text-sm ${getPerformanceColor(performanceData.currentMetrics.gpuTemp, 'temp')}`}>
                  {Math.round(performanceData.currentMetrics.gpuTemp)}°C
                </p>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-emerald-500 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-600 rounded-lg">
                    <HardDrive className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-2xl font-bold ${getPerformanceColor(performanceData.currentMetrics.ramUsage, 'usage')}`}>
                    {Math.round(performanceData.currentMetrics.ramUsage)}%
                  </span>
                </div>
                <h3 className="text-white font-medium">RAM</h3>
                <p className="text-gray-400 text-sm">Memória em uso</p>
              </div>
            </div>

            {/* FPS Chart */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Histórico de FPS
                {performanceData.isCollecting && <span className="text-xs text-green-400">(Atualizando em tempo real)</span>}
              </h3>
              <div className="h-48 flex items-end gap-1 bg-gray-900 p-4 rounded-lg">
                {performanceData.historicalData.map((data, index) => {
                  const height = Math.max((data.fps / 144) * 100, 5);
                  const color = data.fps >= 90 ? 'bg-green-500' : data.fps >= 60 ? 'bg-yellow-500' : 'bg-red-500';
                  return (
                    <div
                      key={index}
                      className={`flex-1 ${color} rounded-t transition-all duration-300 hover:opacity-80`}
                      style={{ height: `${height}%` }}
                      title={`${Math.round(data.fps)} FPS`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{performanceData.historicalData.length} amostras</span>
                <span>Max: 144 FPS</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'games' && (
          <div className="space-y-6">
            {/* Jogos em Execução */}
            {performanceData.runningGames.length > 0 && (
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <Play className="w-5 h-5 text-green-400" />
                    Jogos em Execução
                  </h3>
                  <span className="text-green-400 text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Monitorando em tempo real
                  </span>
                </div>
                
                <div className="space-y-4">
                  {performanceData.runningGames.map((game) => (
                    <div
                      key={game.pid}
                      className="flex items-center justify-between p-4 bg-green-900/20 border border-green-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-600 rounded-lg">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{game.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>PID: {game.pid}</span>
                            <span>RAM: {Math.round(game.memory)}MB</span>
                            {game.cpu !== undefined && <span>CPU: {game.cpu.toFixed(1)}%</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Executando</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Jogos Detectados */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-purple-400" />
                  Jogos Detectados no Sistema
                </h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">
                    {detectedGames.length} jogos encontrados
                  </span>
                  <button
                    onClick={navigateToGamesLibrary}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                  >
                    <Gamepad2 className="w-4 h-4" />
                    Gerenciar Jogos
                  </button>
                </div>
              </div>

              {detectedGames.length === 0 ? (
                <div className="text-center py-12">
                  <Gamepad2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">Nenhum jogo detectado</p>
                  <p className="text-gray-500 text-sm mb-6">
                    Inicie a detecção para encontrar jogos instalados no seu sistema
                  </p>
                  <button
                    onClick={navigateToGamesLibrary}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Gamepad2 className="w-4 h-4" />
                    Iniciar Detecção
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {detectedGames.map((game) => (
                    <div
                      key={game.id}
                      className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4 hover:border-purple-500/50 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-white text-sm truncate" title={game.name}>
                            {game.name}
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">{game.platform}</p>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          {game.platform === 'Steam' && (
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">S</span>
                            </div>
                          )}
                          {game.platform === 'Xbox' && (
                            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">X</span>
                            </div>
                          )}
                          {!['Steam', 'Xbox'].includes(game.platform) && (
                            <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">
                                {game.platform.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {game.installPath && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 truncate" title={game.installPath}>
                            📁 {game.installPath}
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-3 pt-3 border-t border-gray-700/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Status</span>
                          <span className="text-xs text-blue-400 flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            Detectado
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Instruções */}
              {detectedGames.length > 0 && (
                <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-blue-300 font-medium mb-2">Como funciona o monitoramento:</h4>
                      <ul className="text-sm text-blue-200 space-y-1">
                        <li>• Jogos detectados aparecem aqui quando instalados</li>
                        <li>• Quando você executa um jogo, ele aparece em "Jogos em Execução"</li>
                        <li>• Inicie a coleta para monitorar performance em tempo real</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            {/* Active Sessions */}
            {performanceData.activeSessions.length > 0 && (
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Play className="w-5 h-5 text-green-400" />
                  Sessões Ativas
                </h3>
                <div className="space-y-4">
                  {performanceData.activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-600 rounded-lg animate-pulse">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{session.gameName}</h4>
                          <p className="text-gray-400 text-sm">
                            Iniciado: {new Date(session.startTime).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">{Math.round(session.avgFps)} FPS</p>
                        <p className="text-gray-400 text-sm">
                          {Math.round(session.maxFps)} max • {Math.round(session.minFps)} min
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Session History */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Histórico de Sessões
              </h3>
              
              {performanceData.completedSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Nenhuma sessão registrada ainda</p>
                  <p className="text-gray-500 text-sm">As sessões aparecem aqui após finalizar a coleta</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {performanceData.completedSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-600 rounded-lg">
                          <Gamepad2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{session.gameName}</h4>
                          <p className="text-gray-400 text-sm">
                            {session.duration ? `${Math.floor(session.duration / 60)}min` : 'N/A'} • {new Date(session.startTime).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getPerformanceColor(session.avgFps, 'fps')}`}>
                          {Math.round(session.avgFps)} FPS
                        </p>
                        <p className="text-gray-400 text-sm">
                          {Math.round(session.maxFps)} max • {Math.round(session.minFps)} min
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {/* Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-xl text-white shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-8 h-8" />
                  <h4 className="font-bold text-lg">Score Geral</h4>
                </div>
                <div className="text-4xl font-bold mb-2">{performanceData.systemScore}%</div>
                <p className="text-green-100 text-sm">
                  {performanceData.systemScore >= 90 ? 'Excelente!' : 
                   performanceData.systemScore >= 75 ? 'Muito bom' : 
                   performanceData.systemScore >= 60 ? 'Bom' : 'Precisa melhorar'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl text-white shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-8 h-8" />
                  <h4 className="font-bold text-lg">Status</h4>
                </div>
                <div className="text-4xl font-bold mb-2">
                  {performanceData.isCollecting ? 'Ativo' : 'Parado'}
                </div>
                <p className="text-blue-100 text-sm">
                  {performanceData.isCollecting ? 'Coletando dados...' : 'Inicie a coleta'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-xl text-white shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Flame className="w-8 h-8" />
                  <h4 className="font-bold text-lg">Térmico</h4>
                </div>
                <div className="text-4xl font-bold mb-2">
                  {performanceData.currentMetrics.cpuTemp < 70 && performanceData.currentMetrics.gpuTemp < 75 ? 'OK' : 'Alto'}
                </div>
                <p className="text-purple-100 text-sm">
                  CPU: {Math.round(performanceData.currentMetrics.cpuTemp)}°C • GPU: {Math.round(performanceData.currentMetrics.gpuTemp)}°C
                </p>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Análise e Recomendações
              </h3>
              <div className="space-y-3">
                {performanceData.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg">
                    <span className="text-gray-300">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CORREÇÃO CRÍTICA: Elementos decorativos com pointer-events-none */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-10" 
           style={{
             background: `
               radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
               radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
               radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)
             `
           }} 
      />
      <div className="pointer-events-none absolute inset-0 z-0 opacity-5"
           style={{
             backgroundImage: `
               linear-gradient(90deg, rgba(120,119,198,0.1) 1px, transparent 1px),
               linear-gradient(rgba(120,119,198,0.1) 1px, transparent 1px)
             `,
             backgroundSize: '20px 20px'
           }}
      />
    </div>
  );
};

export default PerformanceReport;