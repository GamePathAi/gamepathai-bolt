import React, { useState } from 'react';
import { Zap, BarChart4, Gauge, Cog } from 'lucide-react';

export const FpsBooster: React.FC = () => {
  const [optimizationLevel, setOptimizationLevel] = useState<'balanced' | 'performance' | 'extreme'>('balanced');
  const [customSettings, setCustomSettings] = useState({
    processOptimization: true,
    memoryOptimization: true,
    gpuOptimization: true,
    priorityBoost: false,
  });
  const [boostActive, setBoostActive] = useState(false);

  const handleToggleBoost = () => {
    setBoostActive(!boostActive);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
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
                px-4 py-2 rounded-lg font-medium transition-colors duration-150
                ${boostActive 
                  ? 'bg-red-500 hover:bg-red-400 text-white' 
                  : 'bg-purple-500 hover:bg-purple-400 text-white'
                }
              `}
            >
              {boostActive ? 'Disable Boost' : 'Enable Boost'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Boost Level Selector */}
        <div className="lg:col-span-2 bg-gray-800/60 backdrop-blur-sm border border-purple-500/20 rounded-lg overflow-hidden p-4">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <span className="w-2 h-4 bg-purple-500 rounded-sm mr-2"></span>
            Optimization Level
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => setOptimizationLevel('balanced')}
              className={`
                relative border rounded-lg p-4 cursor-pointer transition-all duration-200
                ${optimizationLevel === 'balanced' 
                  ? 'border-purple-500 bg-gradient-to-r from-purple-500/10 to-transparent' 
                  : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
                }
              `}
            >
              {optimizationLevel === 'balanced' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
              )}
              
              <div className="flex flex-col items-center">
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center mb-3
                  ${optimizationLevel === 'balanced' ? 'bg-purple-500/20' : 'bg-gray-700/80'}
                `}>
                  <Gauge className={optimizationLevel === 'balanced' ? 'text-purple-400' : 'text-gray-400'} size={24} />
                </div>
                <h3 className="text-sm font-medium text-white text-center">Balanced</h3>
                <p className="text-xs text-gray-400 text-center mt-1">Optimal balance between performance and stability</p>
                
                <div className="mt-3 grid grid-cols-3 gap-2 w-full">
                  <div className="h-2 rounded-full bg-purple-500"></div>
                  <div className="h-2 rounded-full bg-purple-500"></div>
                  <div className="h-2 rounded-full bg-gray-700"></div>
                </div>
              </div>
            </div>
            
            <div 
              onClick={() => setOptimizationLevel('performance')}
              className={`
                relative border rounded-lg p-4 cursor-pointer transition-all duration-200
                ${optimizationLevel === 'performance' 
                  ? 'border-purple-500 bg-gradient-to-r from-purple-500/10 to-transparent' 
                  : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
                }
              `}
            >
              {optimizationLevel === 'performance' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
              )}
              
              <div className="flex flex-col items-center">
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center mb-3
                  ${optimizationLevel === 'performance' ? 'bg-purple-500/20' : 'bg-gray-700/80'}
                `}>
                  <Zap className={optimizationLevel === 'performance' ? 'text-purple-400' : 'text-gray-400'} size={24} />
                </div>
                <h3 className="text-sm font-medium text-white text-center">Performance</h3>
                <p className="text-xs text-gray-400 text-center mt-1">Focus on maximum FPS for competitive gaming</p>
                
                <div className="mt-3 grid grid-cols-3 gap-2 w-full">
                  <div className="h-2 rounded-full bg-purple-500"></div>
                  <div className="h-2 rounded-full bg-purple-500"></div>
                  <div className="h-2 rounded-full bg-purple-500"></div>
                </div>
              </div>
            </div>
            
            <div 
              onClick={() => setOptimizationLevel('extreme')}
              className={`
                relative border rounded-lg p-4 cursor-pointer transition-all duration-200
                ${optimizationLevel === 'extreme' 
                  ? 'border-purple-500 bg-gradient-to-r from-purple-500/10 to-transparent' 
                  : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
                }
              `}
            >
              {optimizationLevel === 'extreme' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
              )}
              
              <div className="flex flex-col items-center">
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center mb-3
                  ${optimizationLevel === 'extreme' ? 'bg-purple-500/20' : 'bg-gray-700/80'}
                `}>
                  <svg className={optimizationLevel === 'extreme' ? 'text-purple-400' : 'text-gray-400'} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-white text-center">Extreme</h3>
                <p className="text-xs text-gray-400 text-center mt-1">Maximum performance at all costs</p>
                
                <div className="mt-3 grid grid-cols-3 gap-2 w-full">
                  <div className="h-2 rounded-full bg-purple-500"></div>
                  <div className="h-2 rounded-full bg-purple-500"></div>
                  <div className="h-2 rounded-full bg-purple-500"></div>
                </div>
                
                <div className="mt-2 px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-300">
                  PRO Feature
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-gray-900/70 border border-gray-700 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">Custom Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center mr-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                      <path d="M18 14V17C18 18.1046 17.1046 19 16 19H8C6.89543 19 6 18.1046 6 17V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18 8V5C18 3.89543 17.1046 3 16 3H8C6.89543 3 6 3.89543 6 5V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 11H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M1 11H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 11H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-white">Process Optimization</div>
                    <div className="text-xs text-gray-400">Close background processes</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={customSettings.processOptimization}
                    onChange={() => setCustomSettings({...customSettings, processOptimization: !customSettings.processOptimization})}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500/70 peer-checked:after:bg-white"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center mr-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 9H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 9H15.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-white">Memory Optimization</div>
                    <div className="text-xs text-gray-400">Free up system memory</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={customSettings.memoryOptimization}
                    onChange={() => setCustomSettings({...customSettings, memoryOptimization: !customSettings.memoryOptimization})}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500/70 peer-checked:after:bg-white"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center mr-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-white">GPU Optimization</div>
                    <div className="text-xs text-gray-400">Optimize GPU settings</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={customSettings.gpuOptimization}
                    onChange={() => setCustomSettings({...customSettings, gpuOptimization: !customSettings.gpuOptimization})}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500/70 peer-checked:after:bg-white"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center mr-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                      <path d="M12 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4.93 4.93L7.76 7.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16.24 16.24L19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4.93 19.07L7.76 16.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm text-white">Priority Boost</div>
                      <div className="text-xs text-gray-400">Set games to high priority</div>
                    </div>
                    <div className="ml-2 px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded-sm">
                      PRO
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    disabled
                    checked={customSettings.priorityBoost}
                    onChange={() => setCustomSettings({...customSettings, priorityBoost: !customSettings.priorityBoost})}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-700 opacity-60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500/70 peer-checked:after:bg-white"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Performance Stats */}
        <div className="bg-gray-800/60 backdrop-blur-sm border border-purple-500/20 rounded-lg overflow-hidden p-4">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <span className="w-2 h-4 bg-purple-500 rounded-sm mr-2"></span>
            Performance Boost
          </h2>
          
          <div className="bg-gray-900/70 border border-gray-700 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mr-3">
                  <BarChart4 className="text-purple-400" size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">FPS Improvement</h3>
                  <p className="text-xs text-gray-400">Based on system analysis</p>
                </div>
              </div>
            </div>
            
            <div className="relative pt-8 pb-4">
              <div className="flex justify-between mb-2">
                <div className="flex flex-col items-center">
                  <div className="text-2xl font-bold text-white">68</div>
                  <div className="text-xs text-gray-400">Before</div>
                </div>
                <div className="flex items-center text-green-400 font-bold text-lg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 17L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 7H17V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  +27%
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-2xl font-bold text-purple-400">86</div>
                  <div className="text-xs text-gray-400">After</div>
                </div>
              </div>
              
              <div className="h-8 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gray-700 w-[45%] relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-white font-medium">
                    Before
                  </div>
                </div>
                <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 w-[55%] relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-white font-medium">
                    After
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-900/70 border border-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 mr-2">
                    <path d="M12 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4.93 4.93L7.76 7.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16.24 16.24L19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4.93 19.07L7.76 16.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm text-white">CPU Priority</span>
                </div>
                <div className="text-xs text-green-400">+12%</div>
              </div>
            </div>
            
            <div className="bg-gray-900/70 border border-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 mr-2">
                    <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm text-white">Memory Latency</span>
                </div>
                <div className="text-xs text-green-400">-8%</div>
              </div>
            </div>
            
            <div className="bg-gray-900/70 border border-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 mr-2">
                    <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 10H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm text-white">GPU Performance</span>
                </div>
                <div className="text-xs text-green-400">+15%</div>
              </div>
            </div>
            
            <div className="bg-gray-900/70 border border-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 mr-2">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm text-white">Input Lag</span>
                </div>
                <div className="text-xs text-green-400">-5ms</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button className="w-full py-2 rounded-md bg-gradient-to-r from-purple-600 to-cyan-600 text-sm font-medium text-white flex items-center justify-center">
              <Cog size={16} className="mr-2" />
              Advanced Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};