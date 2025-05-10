import React, { useState, useEffect } from 'react';
import { Zap, BarChart4, Gauge, Cog, Cpu, HardDrive, Fan, Clock } from 'lucide-react';
import { AdvancedSettingsModal } from '../components/modals/AdvancedSettingsModal';

export const FpsBooster: React.FC = () => {
  const [optimizationLevel, setOptimizationLevel] = useState<'balanced' | 'performance' | 'extreme'>('performance');
  const [isBoostEnabled, setIsBoostEnabled] = useState(false);
  const [customSettings, setCustomSettings] = useState({
    processOptimization: true,
    memoryOptimization: true,
    gpuOptimization: true,
    priorityBoost: false,
  });
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
  const [metrics, setMetrics] = useState({
    fps: { before: 68, after: 86, boost: 27 },
    cpuPriority: 12,
    memoryLatency: -8,
    gpuPerformance: 15,
    inputLag: -5
  });

  useEffect(() => {
    if (!isBoostEnabled) return;

    const interval = setInterval(() => {
      setMetrics(prev => ({
        fps: {
          before: prev.fps.before + Math.floor(Math.random() * 3) - 1,
          after: prev.fps.after + Math.floor(Math.random() * 3) - 1,
          boost: Math.floor(((prev.fps.after - prev.fps.before) / prev.fps.before) * 100)
        },
        cpuPriority: prev.cpuPriority + Math.floor(Math.random() * 3) - 1,
        memoryLatency: prev.memoryLatency + Math.floor(Math.random() * 3) - 1,
        gpuPerformance: prev.gpuPerformance + Math.floor(Math.random() * 3) - 1,
        inputLag: prev.inputLag + Math.floor(Math.random() * 2) - 1
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [isBoostEnabled]);

  const handleToggleBoost = () => {
    console.log(`Toggling boost: ${isBoostEnabled} -> ${!isBoostEnabled}`);
    setIsBoostEnabled(!isBoostEnabled);
  };

  const handleOptimizationChange = (level: 'balanced' | 'performance' | 'extreme') => {
    if (level === 'extreme' && !isBoostEnabled) return; // Pro feature check
    console.log(`Changing optimization level: ${optimizationLevel} -> ${level}`);
    setOptimizationLevel(level);
  };

  const handleSettingToggle = (setting: keyof typeof customSettings) => {
    console.log(`Toggling ${setting}: ${customSettings[setting]} -> ${!customSettings[setting]}`);
    setCustomSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
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
          <div className="flex items-center space-x-3">
            <div className="bg-gray-700/50 rounded-lg px-4 py-2 flex items-center">
              <BarChart4 className="text-purple-400 mr-2" size={18} />
              <div>
                <div className="text-xs text-gray-400">FPS Boost</div>
                <div className="text-lg font-bold text-white">+27%</div>
              </div>
            </div>
            <button 
              onClick={handleToggleBoost}
              className={`
                relative px-6 py-2.5 rounded-lg font-medium text-white
                transition-all duration-300 transform hover:scale-105
                overflow-hidden group
                ${isBoostEnabled 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-500 hover:to-purple-300' 
                  : 'bg-gradient-to-r from-purple-500/50 to-purple-400/50 hover:from-purple-500/60 hover:to-purple-400/60'
                }
              `}
            >
              <span className="relative z-10 flex items-center">
                <Zap className={`mr-2 transition-transform duration-300 ${isBoostEnabled ? 'animate-pulse' : ''}`} size={18} />
                {isBoostEnabled ? 'Disable Boost' : 'Enable Boost'}
              </span>
              <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Optimization Level */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800/60 backdrop-blur-sm border border-purple-500/20 rounded-lg p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <span className="w-2 h-4 bg-purple-500 rounded-sm mr-2"></span>
              Optimization Level
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Balanced Mode */}
              <button
                onClick={() => handleOptimizationChange('balanced')}
                className={`
                  relative p-4 rounded-lg border transition-all duration-300
                  hover:transform hover:scale-[1.02] hover:shadow-lg
                  ${optimizationLevel === 'balanced'
                    ? 'border-purple-500 bg-gradient-to-br from-purple-500/20 to-transparent'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
                  }
                `}
              >
                <div className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-lg flex items-center justify-center mb-3
                    transition-colors duration-300
                    ${optimizationLevel === 'balanced' ? 'bg-purple-500/20' : 'bg-gray-700/80'}
                  `}>
                    <Gauge className={`
                      transition-colors duration-300
                      ${optimizationLevel === 'balanced' ? 'text-purple-400' : 'text-gray-400'}
                    `} size={24} />
                  </div>
                  <h3 className="text-sm font-medium text-white">Balanced</h3>
                  <p className="text-xs text-gray-400 text-center mt-1">Optimal balance between performance and stability</p>
                </div>
              </button>

              {/* Performance Mode */}
              <button
                onClick={() => handleOptimizationChange('performance')}
                className={`
                  relative p-4 rounded-lg border transition-all duration-300
                  hover:transform hover:scale-[1.02] hover:shadow-lg
                  ${optimizationLevel === 'performance'
                    ? 'border-purple-500 bg-gradient-to-br from-purple-500/20 to-transparent'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
                  }
                `}
              >
                <div className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-lg flex items-center justify-center mb-3
                    transition-colors duration-300
                    ${optimizationLevel === 'performance' ? 'bg-purple-500/20' : 'bg-gray-700/80'}
                  `}>
                    <Zap className={`
                      transition-colors duration-300
                      ${optimizationLevel === 'performance' ? 'text-purple-400' : 'text-gray-400'}
                    `} size={24} />
                  </div>
                  <h3 className="text-sm font-medium text-white">Performance</h3>
                  <p className="text-xs text-gray-400 text-center mt-1">Focus on maximum FPS for competitive gaming</p>
                </div>
              </button>

              {/* Extreme Mode */}
              <button
                onClick={() => handleOptimizationChange('extreme')}
                disabled={!isBoostEnabled}
                className={`
                  relative p-4 rounded-lg border transition-all duration-300
                  ${isBoostEnabled ? 'hover:transform hover:scale-[1.02] hover:shadow-lg' : 'opacity-60 cursor-not-allowed'}
                  ${optimizationLevel === 'extreme'
                    ? 'border-purple-500 bg-gradient-to-br from-purple-500/20 to-transparent'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
                  }
                `}
              >
                <div className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-lg flex items-center justify-center mb-3
                    transition-colors duration-300
                    ${optimizationLevel === 'extreme' ? 'bg-purple-500/20' : 'bg-gray-700/80'}
                  `}>
                    <Fan className={`
                      transition-colors duration-300
                      ${optimizationLevel === 'extreme' ? 'text-purple-400' : 'text-gray-400'}
                    `} size={24} />
                  </div>
                  <h3 className="text-sm font-medium text-white">Extreme</h3>
                  <p className="text-xs text-gray-400 text-center mt-1">Maximum performance at all costs</p>
                  <span className="mt-2 px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded">PRO</span>
                </div>
              </button>
            </div>
          </div>

          {/* Custom Settings */}
          <div className="bg-gray-800/60 backdrop-blur-sm border border-purple-500/20 rounded-lg p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <span className="w-2 h-4 bg-purple-500 rounded-sm mr-2"></span>
              Custom Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Process Optimization */}
              <button
                onClick={() => handleSettingToggle('processOptimization')}
                className={`
                  flex items-center justify-between p-4 rounded-lg border
                  transition-all duration-300 hover:border-purple-500/50
                  ${customSettings.processOptimization
                    ? 'border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-transparent'
                    : 'border-gray-700 bg-gray-900/50'
                  }
                `}
              >
                <div className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center mr-3
                    ${customSettings.processOptimization ? 'bg-purple-500/20' : 'bg-gray-700'}
                  `}>
                    <Cpu className={customSettings.processOptimization ? 'text-purple-400' : 'text-gray-400'} size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Process Optimization</div>
                    <div className="text-xs text-gray-400">Close background processes</div>
                  </div>
                </div>
                <div className={`
                  w-12 h-6 rounded-full transition-colors duration-300
                  ${customSettings.processOptimization ? 'bg-purple-500' : 'bg-gray-700'}
                  relative
                `}>
                  <div className={`
                    absolute top-1 w-4 h-4 rounded-full bg-white
                    transition-transform duration-300
                    ${customSettings.processOptimization ? 'translate-x-6' : 'translate-x-1'}
                  `} />
                </div>
              </button>

              {/* Memory Optimization */}
              <button
                onClick={() => handleSettingToggle('memoryOptimization')}
                className={`
                  flex items-center justify-between p-4 rounded-lg border
                  transition-all duration-300 hover:border-purple-500/50
                  ${customSettings.memoryOptimization
                    ? 'border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-transparent'
                    : 'border-gray-700 bg-gray-900/50'
                  }
                `}
              >
                <div className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center mr-3
                    ${customSettings.memoryOptimization ? 'bg-purple-500/20' : 'bg-gray-700'}
                  `}>
                    <HardDrive className={customSettings.memoryOptimization ? 'text-purple-400' : 'text-gray-400'} size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Memory Optimization</div>
                    <div className="text-xs text-gray-400">Free up system memory</div>
                  </div>
                </div>
                <div className={`
                  w-12 h-6 rounded-full transition-colors duration-300
                  ${customSettings.memoryOptimization ? 'bg-purple-500' : 'bg-gray-700'}
                  relative
                `}>
                  <div className={`
                    absolute top-1 w-4 h-4 rounded-full bg-white
                    transition-transform duration-300
                    ${customSettings.memoryOptimization ? 'translate-x-6' : 'translate-x-1'}
                  `} />
                </div>
              </button>

              {/* GPU Optimization */}
              <button
                onClick={() => handleSettingToggle('gpuOptimization')}
                className={`
                  flex items-center justify-between p-4 rounded-lg border
                  transition-all duration-300 hover:border-purple-500/50
                  ${customSettings.gpuOptimization
                    ? 'border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-transparent'
                    : 'border-gray-700 bg-gray-900/50'
                  }
                `}
              >
                <div className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center mr-3
                    ${customSettings.gpuOptimization ? 'bg-purple-500/20' : 'bg-gray-700'}
                  `}>
                    <Fan className={customSettings.gpuOptimization ? 'text-purple-400' : 'text-gray-400'} size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">GPU Optimization</div>
                    <div className="text-xs text-gray-400">Optimize GPU settings</div>
                  </div>
                </div>
                <div className={`
                  w-12 h-6 rounded-full transition-colors duration-300
                  ${customSettings.gpuOptimization ? 'bg-purple-500' : 'bg-gray-700'}
                  relative
                `}>
                  <div className={`
                    absolute top-1 w-4 h-4 rounded-full bg-white
                    transition-transform duration-300
                    ${customSettings.gpuOptimization ? 'translate-x-6' : 'translate-x-1'}
                  `} />
                </div>
              </button>

              {/* Priority Boost */}
              <button
                disabled={!isBoostEnabled}
                onClick={() => handleSettingToggle('priorityBoost')}
                className={`
                  flex items-center justify-between p-4 rounded-lg border
                  transition-all duration-300
                  ${!isBoostEnabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-purple-500/50'}
                  ${customSettings.priorityBoost
                    ? 'border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-transparent'
                    : 'border-gray-700 bg-gray-900/50'
                  }
                `}
              >
                <div className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center mr-3
                    ${customSettings.priorityBoost ? 'bg-purple-500/20' : 'bg-gray-700'}
                  `}>
                    <Clock className={customSettings.priorityBoost ? 'text-purple-400' : 'text-gray-400'} size={20} />
                  </div>
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-white">Priority Boost</div>
                      <div className="text-xs text-gray-400">Set games to high priority</div>
                    </div>
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded">PRO</span>
                  </div>
                </div>
                <div className={`
                  w-12 h-6 rounded-full transition-colors duration-300
                  ${customSettings.priorityBoost ? 'bg-purple-500' : 'bg-gray-700'}
                  relative
                `}>
                  <div className={`
                    absolute top-1 w-4 h-4 rounded-full bg-white
                    transition-transform duration-300
                    ${customSettings.priorityBoost ? 'translate-x-6' : 'translate-x-1'}
                  `} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Performance Boost Panel */}
        <div className="bg-gray-800/60 backdrop-blur-sm border border-purple-500/20 rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <span className="w-2 h-4 bg-purple-500 rounded-sm mr-2"></span>
            Performance Boost
          </h2>

          <div className="space-y-6">
            {/* FPS Improvement */}
            <div className="bg-gray-900/70 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mr-3">
                  <BarChart4 className="text-purple-400" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">FPS Improvement</h3>
                  <p className="text-xs text-gray-400">Based on system analysis</p>
                </div>
              </div>

              <div className="flex justify-between items-center mb-2">
                <div className="text-2xl font-bold text-white">{metrics.fps.before}</div>
                <div className="text-green-400 flex items-center">
                  <Zap size={16} className="mr-1" />
                  +{metrics.fps.boost}%
                </div>
                <div className="text-2xl font-bold text-purple-400">{metrics.fps.after}</div>
              </div>

              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-500" 
                  style={{ width: `${(metrics.fps.after / (metrics.fps.before * 2)) * 100}%` }} 
                />
              </div>

              <div className="flex justify-between mt-1 text-xs text-gray-400">
                <span>Before</span>
                <span>After</span>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-4">
              <div className="bg-gray-900/70 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Cpu className="text-gray-400 mr-2" size={16} />
                    <span className="text-sm text-white">CPU Priority</span>
                  </div>
                  <span className="text-green-400 text-sm">+{metrics.cpuPriority}%</span>
                </div>
              </div>

              <div className="bg-gray-900/70 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <HardDrive className="text-gray-400 mr-2" size={16} />
                    <span className="text-sm text-white">Memory Latency</span>
                  </div>
                  <span className="text-green-400 text-sm">{metrics.memoryLatency}%</span>
                </div>
              </div>

              <div className="bg-gray-900/70 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Fan className="text-gray-400 mr-2" size={16} />
                    <span className="text-sm text-white">GPU Performance</span>
                  </div>
                  <span className="text-green-400 text-sm">+{metrics.gpuPerformance}%</span>
                </div>
              </div>

              <div className="bg-gray-900/70 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Clock className="text-gray-400 mr-2" size={16} />
                    <span className="text-sm text-white">Input Lag</span>
                  </div>
                  <span className="text-green-400 text-sm">{metrics.inputLag}ms</span>
                </div>
              </div>
            </div>

            {/* Advanced Settings Button */}
            <button 
              onClick={() => setIsAdvancedSettingsOpen(true)}
              className="w-full py-2.5 rounded-lg bg-purple-500/20 text-purple-300 font-medium hover:bg-purple-500/30 transition-colors duration-200 flex items-center justify-center"
            >
              <Cog size={16} className="mr-2" />
              Advanced Settings
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Settings Modal */}
      <AdvancedSettingsModal 
        isOpen={isAdvancedSettingsOpen}
        onClose={() => setIsAdvancedSettingsOpen(false)}
      />
    </div>
  );
};