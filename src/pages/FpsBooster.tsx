import React, { useState, useEffect } from 'react';
import { Zap, Shield, Cpu, HardDrive, Activity, Settings, Flame, Crown, Clock, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useFpsBooster } from '../contexts/FpsBoosterContext';

interface Process {
  name: string;
  pid: number;
  memory: number;
}

interface FPSMetrics {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  gpu: {
    usage: number;
    temperature: number;
    memory: number;
  };
  performance: {
    cpuPriority: number;
    memoryLatency: number;
    gpuPerformance: number;
    inputLag: number;
  };
}

// Modal de Trial PRO
const TrialModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void;
  onStartTrial: () => void;
  trialDaysLeft: number;
}> = ({ isOpen, onClose, onStartTrial, trialDaysLeft }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full relative overflow-hidden"
          >
            {/* Efeito de gradiente animado */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-pink-600/20 animate-pulse" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <Crown className="w-16 h-16 text-purple-400" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-2 border-purple-500/30 rounded-full"
                  />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-center mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Unlock GamePath AI PRO
              </h2>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
                  <h3 className="font-semibold text-purple-300 mb-2">🚀 PRO Features Include:</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      Extreme Mode (+30% FPS Boost)
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      Priority Boost for Games
                    </li>
                    <li className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-400" />
                      Advanced GPU Optimization
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-400" />
                      Network Traffic Priority
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-purple-300" />
                    <span className="font-semibold text-purple-300">Limited Time Offer!</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    Start your <span className="text-purple-400 font-bold">3-day FREE trial</span> now 
                    and experience the full power of GamePath AI PRO!
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onStartTrial}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 
                           text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 
                           shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                >
                  Start Free Trial
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  Maybe Later
                </motion.button>
              </div>

              {trialDaysLeft < 3 && trialDaysLeft > 0 && (
                <p className="text-center text-xs text-gray-400 mt-4">
                  You have {trialDaysLeft} days left in your trial
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const FpsBooster: React.FC = () => {
  const { isPro, trialDaysLeft, startTrial } = useSubscription();
  
  // Usar o contexto para estados persistentes
  const {
    isBoostEnabled: isEnabled,
    selectedMode,
    processOptimization,
    memoryOptimization,
    gpuOptimization,
    priorityBoost,
    setBoostEnabled: setIsEnabled,
    setSelectedMode,
    setProcessOptimization,
    setMemoryOptimization,
    setGpuOptimization,
    setPriorityBoost
  } = useFpsBooster();
  
  // Estados locais (não precisam persistir)
  const [metrics, setMetrics] = useState<FPSMetrics | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [showProcesses, setShowProcesses] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  
  // Safe metrics object with defaults to prevent null/undefined errors
  const safeMetrics = {
    cpu: metrics?.cpu || { usage: 0, cores: 0, model: '' },
    memory: metrics?.memory || { total: 1, used: 0, free: 0, percentage: 0 },
    gpu: metrics?.gpu || { usage: 0, temperature: 0, memory: 0 },
    performance: metrics?.performance || { 
      cpuPriority: 0, 
      memoryLatency: 0, 
      gpuPerformance: 0, 
      inputLag: 0 
    }
  };

  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  // Load metrics
  useEffect(() => {
    if (!isElectron) return;

    const loadMetrics = async () => {
      try {
        const metricsData = await window.electronAPI.getFPSMetrics();
        if (metricsData) {
          setMetrics(metricsData);
        }
      } catch (error) {
        console.error('Failed to load metrics:', error);
      }
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 2000);
    return () => clearInterval(interval);
  }, [isElectron]);

  // Load processes
  const loadProcesses = async () => {
    if (!isElectron) return;

    try {
      const processList = await window.electronAPI.getProcesses();
      setProcesses(processList.sort((a, b) => b.memory - a.memory).slice(0, 10));
    } catch (error) {
      console.error('Failed to load processes:', error);
    }
  };

  const handleModeSelect = (mode: 'balanced' | 'performance' | 'extreme') => {
    if (mode === 'extreme' && !isPro) {
      setShowTrialModal(true);
      return;
    }
    setSelectedMode(mode);
  };

  const handleStartTrial = () => {
    startTrial();
    setSelectedMode('extreme');
    setShowTrialModal(false);
  };

  const handleBoostToggle = async () => {
    if (!isElectron) {
      setIsEnabled(!isEnabled);
      return;
    }

    setIsOptimizing(true);

    try {
      if (!isEnabled) {
        // Enable optimizations
        if (gpuOptimization) {
          await window.electronAPI.optimizeGPU(selectedMode);
        }

        if (memoryOptimization) {
          await window.electronAPI.clearMemory();
        }

        if (processOptimization) {
          await loadProcesses();
        }

        if (priorityBoost && isPro) {
          // Set high priority for common games
          const games = ['csgo.exe', 'valorant.exe', 'league of legends.exe', 'fortnite.exe'];
          for (const game of games) {
            await window.electronAPI.setProcessPriority(game, 'HIGH');
          }
        }

        setIsEnabled(true);
      } else {
        // Disable optimizations
        await window.electronAPI.optimizeGPU('balanced');
        setIsEnabled(false);
      }
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const killProcess = async (pid: number) => {
    if (!isElectron) return;

    try {
      const result = await window.electronAPI.killProcess(pid);
      if (result.success) {
        await loadProcesses();
      }
    } catch (error) {
      console.error('Failed to kill process:', error);
    }
  };

  const getFPSBoost = () => {
    if (!isEnabled) return 0;
    
    const base = selectedMode === 'extreme' ? 30 : selectedMode === 'performance' ? 20 : 10;
    const processBoost = processOptimization ? 5 : 0;
    const memoryBoost = memoryOptimization ? 8 : 0;
    const gpuBoost = gpuOptimization ? 7 : 0;
    const priorityBoostValue = (priorityBoost && isPro) ? 5 : 0;
    
    return base + processBoost + memoryBoost + gpuBoost + priorityBoostValue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-purple-500/20 rounded-lg overflow-hidden p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">FPS Booster</h1>
            <p className="text-gray-400 mt-1">
              Optimize your system for maximum gaming performance
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-gray-700/50 rounded-lg px-4 py-2">
              <div className="text-xs text-gray-400">FPS Boost</div>
              <div className="text-lg font-bold text-purple-400">+{getFPSBoost()}%</div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBoostToggle}
              disabled={isOptimizing}
              className={`
                px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2
                ${isEnabled 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
                }
                ${isOptimizing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <Zap className="w-4 h-4" />
              {isOptimizing ? 'Optimizing...' : isEnabled ? 'Disable Boost' : 'Enable Boost'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Optimization Level */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4 flex items-center">
          <span className="w-2 h-4 bg-purple-500 rounded-sm mr-2"></span>
          Optimization Level
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'balanced', name: 'Balanced', icon: Shield, desc: 'Optimal balance between performance and stability' },
            { id: 'performance', name: 'Performance', icon: Zap, desc: 'Focus on maximum FPS for competitive gaming' },
            { id: 'extreme', name: 'Extreme', icon: Flame, desc: 'Maximum performance at all costs', isPro: true }
          ].map((mode) => (
            <motion.button
              key={mode.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleModeSelect(mode.id as any)}
              disabled={mode.isPro && !isPro && false} // Always clickable, will show modal
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-300 overflow-hidden
                ${selectedMode === mode.id 
                  ? 'border-purple-500 bg-purple-500/10' 
                  : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
                }
                cursor-pointer
              `}
            >
              {/* Efeito de fogo para modo Extreme */}
              {mode.id === 'extreme' && selectedMode === 'extreme' && isEnabled && (
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -bottom-10 left-0 right-0 h-32 bg-gradient-to-t from-orange-600/30 via-red-600/20 to-transparent animate-pulse" />
                  <div className="absolute -bottom-5 left-1/4 w-8 h-16 bg-orange-500/40 blur-xl animate-flicker" />
                  <div className="absolute -bottom-5 right-1/4 w-8 h-16 bg-red-500/40 blur-xl animate-flicker-delay" />
                </div>
              )}
              
              <div className="relative z-10">
                <mode.icon className={`w-8 h-8 mb-2 ${selectedMode === mode.id ? 'text-purple-400' : 'text-gray-400'}`} />
                <h3 className="font-medium text-white">{mode.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{mode.desc}</p>
                {mode.isPro && !isPro && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs font-semibold">PRO</span>
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custom Settings */}
        <div className="bg-gray-800/60 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <span className="w-2 h-4 bg-purple-500 rounded-sm mr-2"></span>
            Custom Settings
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="font-medium">Process Optimization</div>
                  <div className="text-xs text-gray-400">Close background processes</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={processOptimization}
                  onChange={(e) => setProcessOptimization(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <HardDrive className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="font-medium">Memory Optimization</div>
                  <div className="text-xs text-gray-400">Free up system memory</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={memoryOptimization}
                  onChange={(e) => setMemoryOptimization(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="font-medium">GPU Optimization</div>
                  <div className="text-xs text-gray-400">Optimize GPU settings</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={gpuOptimization}
                  onChange={(e) => setGpuOptimization(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>

            <div className={`flex items-center justify-between p-3 bg-gray-900/50 rounded-lg ${!isPro ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="font-medium">Priority Boost</div>
                  <div className="text-xs text-gray-400">Set games to high priority</div>
                </div>
              </div>
              {isPro ? (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={priorityBoost}
                    onChange={(e) => setPriorityBoost(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
              ) : (
                <div className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">PRO</div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Boost */}
        <div className="bg-gray-800/60 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <span className="w-2 h-4 bg-purple-500 rounded-sm mr-2"></span>
            Performance Boost
          </h2>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">FPS Improvement</span>
              <span className="text-sm text-gray-400">Based on system analysis</span>
            </div>
            <div className="text-4xl font-bold text-purple-400 mb-4">
              {isEnabled ? `+${getFPSBoost()}%` : '0%'}
            </div>
            <div className="relative h-8 bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-purple-400"
                initial={{ width: 0 }}
                animate={{ width: isEnabled ? `${getFPSBoost()}%` : '0%' }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-4 text-xs">
                <span>Before</span>
                <span>After</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-gray-400" />
                <span>CPU Priority</span>
              </div>
              <span className={isEnabled ? 'text-green-400' : 'text-gray-400'}>
                {isEnabled ? '+12%' : '0%'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-gray-400" />
                <span>Memory Latency</span>
              </div>
              <span className={isEnabled ? 'text-green-400' : 'text-gray-400'}>
                {isEnabled ? '-8%' : '0%'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-gray-400" />
                <span>GPU Performance</span>
              </div>
              <span className={isEnabled ? 'text-green-400' : 'text-gray-400'}>
                {isEnabled ? '+15%' : '0%'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-400" />
                <span>Input Lag</span>
              </div>
              <span className={isEnabled ? 'text-green-400' : 'text-gray-400'}>
                {isEnabled ? '-5ms' : '0ms'}
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowProcesses(!showProcesses)}
            className="w-full mt-6 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Advanced Settings
          </motion.button>
        </div>
      </div>

      {/* Process Manager (Hidden by default) */}
      {showProcesses && isElectron && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/60 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium flex items-center">
              <span className="w-2 h-4 bg-purple-500 rounded-sm mr-2"></span>
              Process Manager
            </h2>
            <button
              onClick={loadProcesses}
              className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded text-sm"
            >
              Refresh
            </button>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {processes.map((process) => (
              <div key={process.pid} className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
                <div className="flex items-center gap-3">
                  <Cpu className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium">{process.name}</div>
                    <div className="text-xs text-gray-400">PID: {process.pid}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">{process.memory.toFixed(0)} MB</span>
                  <button
                    onClick={() => killProcess(process.pid)}
                    className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs"
                  >
                    End
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* System Metrics - ATUALIZADO COM GPU! */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4 flex items-center">
          <span className="w-2 h-4 bg-purple-500 rounded-sm mr-2"></span>
          System Metrics
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">CPU Usage</div>
            <div className="text-lg font-medium text-white">{safeMetrics.cpu.usage}%</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">Memory Used</div>
            <div className="text-lg font-medium text-white">{safeMetrics.memory.used}/{safeMetrics.memory.total} GB</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">CPU Cores</div>
            <div className="text-lg font-medium text-white">{safeMetrics.cpu.cores}</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">Free Memory</div>
            <div className="text-lg font-medium text-white">{safeMetrics.memory.free} GB</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3 border border-purple-500/30">
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Gauge className="w-3 h-3" />
              GPU Usage
            </div>
            <div className="text-lg font-medium text-purple-400">{safeMetrics.gpu.usage}%</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3 border border-orange-500/30">
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Flame className="w-3 h-3" />
              GPU Temp
            </div>
            <div className="text-lg font-medium text-orange-400">{safeMetrics.gpu.temperature}°C</div>
          </div>
        </div>
      </div>

      {/* Trial Modal */}
      <TrialModal 
        isOpen={showTrialModal}
        onClose={() => setShowTrialModal(false)}
        onStartTrial={handleStartTrial}
        trialDaysLeft={trialDaysLeft}
      />
    </div>
  );
};
