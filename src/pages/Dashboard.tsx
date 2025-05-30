import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  HardDrive, 
  Zap, 
  Activity, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Gauge,
  Thermometer,
  Gamepad2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { OptimizationNotification } from '../components/OptimizationNotification';
import { useNavigate } from 'react-router-dom';

interface SystemInfo {
  cpu: {
    model: string;
    usage: number;
    cores: number;
    threads: number;
    baseSpeed: number;
    currentSpeed: number;
  };
  memory: {
    total: number;
    used: number;
    available: number;
    usage: number;
  };
  gpu: {
    model: string;
    usage: number;
    temperature: number;
    memory: number;
    totalMemory: number;
  };
  system: {
    platform: string;
    version: string;
    uptime: string;
  };
}

interface DetectedGame {
  id: string;
  name: string;
  platform: string;
  installPath?: string;
  executablePath?: string;
  appId?: string;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  
  // Estado para métricas reais
  const [realMetrics, setRealMetrics] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Estados para jogos detectados
  const [detectedGames, setDetectedGames] = useState<DetectedGame[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  
  // Estado para informações do sistema (fallback)
  const [systemInfo] = useState<SystemInfo>({
    cpu: {
      model: 'Intel Core i9-13900H',
      usage: 54.9,
      cores: 14,
      threads: 20,
      baseSpeed: 2.60,
      currentSpeed: 3.44
    },
    memory: {
      total: 32,
      used: 15.23,
      available: 16.77,
      usage: 47.6
    },
    gpu: {
      model: 'NVIDIA GeForce RTX 4070',
      usage: 52.3,
      temperature: 66,
      memory: 2.41,
      totalMemory: 8
    },
    system: {
      platform: 'Windows 11 Home',
      version: 'Build 26100',
      uptime: '2h 14m'
    }
  });

  // Carregar métricas reais
  useEffect(() => {
    if (!isElectron) return;
    
    const loadMetrics = async () => {
      try {
        const metrics = await window.electronAPI.getFPSMetrics();
        if (metrics) {
          setRealMetrics(metrics);
        }
      } catch (error) {
        console.error('Failed to load real metrics:', error);
      }
    };
    
    loadMetrics();
    const interval = setInterval(loadMetrics, 3000);
    
    return () => clearInterval(interval);
  }, [isElectron]);

  // useEffect para carregar jogos do localStorage
  useEffect(() => {
    const loadDetectedGames = () => {
      try {
        // Carregar jogos detectados salvos no localStorage
        const savedGames = localStorage.getItem('detected-games');
        if (savedGames) {
          const games: DetectedGame[] = JSON.parse(savedGames);
          setDetectedGames(games);
          console.log(`✅ Dashboard carregou ${games.length} jogos do localStorage`);
        } else {
          console.log('⚠️ Nenhum jogo encontrado no localStorage');
        }
      } catch (error) {
        console.error('❌ Erro ao carregar jogos detectados:', error);
      } finally {
        setGamesLoading(false);
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

  // Debug helper
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).dashboardDebug = {
        realMetrics,
        systemInfo,
        isElectron
      };
    }
  }, [realMetrics, systemInfo, isElectron]);

  // Quick actions
  const quickActions = [
    {
      title: 'FPS Booster',
      description: 'Optimize gaming performance',
      icon: Zap,
      color: 'from-purple-500 to-pink-500',
      action: () => navigate('/app/fps')
    },
    {
      title: 'Network Optimizer',
      description: 'Reduce latency and ping',
      icon: Activity,
      color: 'from-blue-500 to-cyan-500',
      action: () => navigate('/app/network')
    },
    {
      title: 'System Monitor',
      description: 'Real-time performance tracking',
      icon: Gauge,
      color: 'from-green-500 to-emerald-500',
      action: () => navigate('/app/system')
    }
  ];

  const handleOneClickOptimize = async () => {
    if (!isElectron) {
      navigate('/app/fps');
      return;
    }
    
    setIsOptimizing(true);
    
    try {
      const result = await window.electronAPI.oneClickOptimize();
      setNotificationData(result);
      setShowNotification(true);
      
      // Recarregar métricas após otimização
      if (result.success) {
        setTimeout(async () => {
          const metrics = await window.electronAPI.getFPSMetrics();
          if (metrics) {
            setRealMetrics(metrics);
          }
        }, 1000);
      }
    } catch (error: any) {
      setNotificationData({
        success: false,
        message: 'Failed to optimize: ' + error.message
      });
      setShowNotification(true);
    } finally {
      setIsOptimizing(false);
    }
  };

  const startGameDetection = () => {
    navigate('/app/games');
  };

  const renderDetectedGames = () => (
    <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium flex items-center">
          <span className="w-2 h-4 bg-purple-500 rounded-sm mr-2"></span>
          Jogos Detectados
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {detectedGames.length} jogos encontrados
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGameDetection}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
          >
            <Gamepad2 className="w-4 h-4" />
            Gerenciar Jogos
          </motion.button>
        </div>
      </div>

      {gamesLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-gray-400">Carregando jogos...</span>
        </div>
      ) : detectedGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {detectedGames.slice(0, 4).map((game) => (
            <motion.div
              key={game.id}
              className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4 hover:border-purple-500/50 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
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
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Detectado
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
          
          {detectedGames.length > 4 && (
            <motion.div
              className="bg-gray-900/30 border border-gray-700/30 border-dashed rounded-lg p-4 flex items-center justify-center cursor-pointer hover:border-purple-500/50 transition-colors"
              whileHover={{ scale: 1.02 }}
              onClick={startGameDetection}
            >
              <div className="text-center">
                <Gamepad2 className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">+{detectedGames.length - 4} jogos</p>
                <p className="text-xs text-gray-500">Ver todos</p>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-white font-medium mb-2">Nenhum jogo detectado</h4>
          <p className="text-gray-400 text-sm mb-6">
            Inicie a detecção para encontrar jogos instalados no seu sistema
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGameDetection}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <Gamepad2 className="w-4 h-4" />
            Iniciar Detecção
          </motion.button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with One-Click Optimize */}
      <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-sm border border-purple-500/20 rounded-lg p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              GamePath AI is ready to optimize
            </h1>
            <p className="text-gray-400">
              Boost your gaming performance with our AI-powered optimization system
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-8 py-4 ${isOptimizing ? 'bg-gray-600' : 'bg-gradient-to-r from-cyan-500 to-cyan-400'} text-gray-900 font-bold rounded-lg ${isOptimizing ? '' : 'hover:from-cyan-400 hover:to-cyan-300'} transition-all duration-300 flex items-center gap-2`}
            onClick={handleOneClickOptimize}
            disabled={isOptimizing}
          >
            <Zap className={`w-5 h-5 ${isOptimizing ? 'animate-pulse' : ''}`} />
            {isOptimizing ? 'Optimizing...' : 'One-Click Optimize'}
          </motion.button>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4 flex items-center">
          <span className="w-2 h-4 bg-purple-500 rounded-sm mr-2"></span>
          System Information
        </h2>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>Acer Nitro ANV15-51</span>
          <span>•</span>
          <span>{systemInfo.system.platform}</span>
          <span>•</span>
          <span>{systemInfo.system.version}</span>
          <div className="ml-auto flex items-center gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              🔄 Refresh
            </button>
            <button 
              onClick={() => navigate('/app/system')}
              className="px-4 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded transition-colors"
            >
              ⚡ Diagnostics
            </button>
          </div>
        </div>
      </div>

      {/* Hardware Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CPU Card */}
        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Cpu className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-xs text-gray-500">
              {realMetrics?.cpu?.temperature ? `${realMetrics.cpu.temperature}°C` : `${systemInfo.cpu.currentSpeed} GHz`}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-400">
            {realMetrics?.cpu?.model || systemInfo.cpu.model}
          </h3>
          <div className="mt-2">
            <div className="text-3xl font-bold text-white">
              {realMetrics?.cpu?.usage || systemInfo.cpu.usage}%
            </div>
            <div className="text-xs text-gray-500 mt-1">Usage</div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cores</span>
              <span className="text-gray-300">{realMetrics?.cpu?.cores || systemInfo.cpu.cores}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Threads</span>
              <span className="text-gray-300">{systemInfo.cpu.threads}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                initial={{ width: 0 }}
                animate={{ width: `${realMetrics?.cpu?.usage || systemInfo.cpu.usage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Memory Card */}
        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <HardDrive className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-xs text-gray-500">{systemInfo.memory.total} GB</span>
          </div>
          <h3 className="text-sm font-medium text-gray-400">Memory</h3>
          <div className="mt-2">
            <div className="text-3xl font-bold text-white">
              {realMetrics?.memory?.percentage || systemInfo.memory.usage}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {realMetrics?.memory?.used || systemInfo.memory.used} GB used
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total</span>
              <span className="text-gray-300">{systemInfo.memory.total} GB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Available</span>
              <span className="text-gray-300">
                {realMetrics?.memory?.free || systemInfo.memory.available} GB
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
                initial={{ width: 0 }}
                animate={{ width: `${realMetrics?.memory?.percentage || systemInfo.memory.usage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* GPU Card */}
        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Zap className="w-6 h-6 text-red-400" />
            </div>
            <span className="text-xs text-gray-500">
              {realMetrics?.gpu?.temperature || systemInfo.gpu.temperature}°C
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-400">
            {realMetrics?.gpu?.name || systemInfo.gpu.model}
          </h3>
          <div className="mt-2">
            <div className="text-3xl font-bold text-white">
              {realMetrics?.gpu?.usage || systemInfo.gpu.usage}%
            </div>
            <div className="text-xs text-gray-500 mt-1">GPU Usage</div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Vendor</span>
              <span className="text-gray-300">NVIDIA</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">VRAM Used</span>
              <span className="text-gray-300">
                {realMetrics?.gpu?.memory || systemInfo.gpu.memory} GB
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-red-500 to-orange-400"
                initial={{ width: 0 }}
                animate={{ width: `${realMetrics?.gpu?.usage || systemInfo.gpu.usage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* System Card */}
        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Activity className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-xs text-gray-500">Uptime</span>
          </div>
          <h3 className="text-sm font-medium text-gray-400">System</h3>
          <div className="mt-2">
            <div className="text-3xl font-bold text-white">{systemInfo.system.uptime}</div>
            <div className="text-xs text-gray-500 mt-1">Uptime</div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Manufacturer</span>
              <span className="text-gray-300">Acer</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Model</span>
              <span className="text-gray-300">Nitro ANV15-51</span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/app/system')}
            className="w-full mt-4 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-sm font-medium transition-colors"
          >
            Stop Monitoring
          </motion.button>
        </div>
      </div>

      {/* Detected Games Section */}
      {renderDetectedGames()}

      {/* Real-time Metrics */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium flex items-center">
            <span className="w-2 h-4 bg-purple-500 rounded-sm mr-2"></span>
            Real-time Metrics
          </h2>
          <span className="text-xs text-gray-500">Updated every 2s</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">CPU Usage</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {realMetrics?.cpu?.usage !== undefined ? `${realMetrics.cpu.usage}%` : '0.0%'}
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Memory Usage</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {realMetrics?.memory?.percentage !== undefined ? `${realMetrics.memory.percentage}%` : '0.0%'}
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-red-400" />
              <span className="text-xs text-gray-400">GPU Usage</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {realMetrics?.gpu?.usage !== undefined ? `${realMetrics.gpu.usage}%` : '0.0%'}
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-gray-400">GPU Temperature</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {realMetrics?.gpu?.temperature !== undefined ? `${realMetrics.gpu.temperature}°C` : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.action}
              className="w-full p-6 bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg hover:border-purple-500/50 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${action.color} p-3 mb-4`}>
                <action.icon className="w-full h-full text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{action.title}</h3>
              <p className="text-sm text-gray-400">{action.description}</p>
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* Performance History Preview */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium flex items-center">
            <span className="w-2 h-4 bg-purple-500 rounded-sm mr-2"></span>
            Performance History
          </h2>
          <button 
            onClick={() => navigate('/app/performance')}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            View Details →
          </button>
        </div>
        
        <div className="h-32 flex items-end justify-between gap-2">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-purple-500/50 to-purple-500/20 rounded-t"
              style={{ height: `${Math.random() * 100}%` }}
            />
          ))}
        </div>
      </div>
    
      {/* Optimization Notification */}
      <OptimizationNotification
        show={showNotification}
        success={notificationData?.success || false}
        message={notificationData?.message || ''}
        details={notificationData?.optimizations}
        onClose={() => setShowNotification(false)}
      />
    </div>
  );
};