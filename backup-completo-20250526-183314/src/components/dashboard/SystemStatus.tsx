import React from 'react';
import { Cpu, HardDrive, Fan, Thermometer, ChevronsUpDown } from 'lucide-react';

export const SystemStatus: React.FC = () => {
  const cpuData = [30, 45, 38, 50, 42, 60, 55, 58, 62, 48, 52, 42, 65, 58, 53, 42, 37, 42, 48, 52];
  const memoryData = [40, 42, 41, 45, 48, 52, 55, 58, 60, 62, 64, 62, 60, 58, 60, 62, 64, 65, 66, 68];
  const networkData = [10, 15, 12, 18, 22, 28, 30, 25, 20, 15, 18, 22, 24, 28, 32, 35, 30, 25, 22, 20];
  
  // Helper to convert data arrays to SVG path
  const getPath = (data: number[], height: number) => {
    if (data.length === 0) return '';
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const width = 100 / (data.length - 1);
    
    return data.map((value, index) => {
      const x = index * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  return (
    <div className="bg-gray-800/60 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4">
      <h2 className="text-lg font-medium mb-4 flex items-center">
        <span className="w-2 h-4 bg-cyan-500 rounded-sm mr-2"></span>
        System Performance
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CPU Status */}
        <div className="bg-gray-900/50 rounded-lg border border-cyan-500/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center mr-3">
                <Cpu className="text-cyan-400" size={18} />
              </div>
              <div>
                <h3 className="font-medium text-white">CPU</h3>
                <p className="text-xs text-gray-400">Intel Core i7-12700K</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-cyan-400">42%</span>
              <div className="flex items-center text-xs text-gray-400">
                <Thermometer size={12} className="mr-1" />
                <span>62°C</span>
              </div>
            </div>
          </div>
          
          <div className="relative h-16">
            <svg className="w-full h-full">
              <path
                d={getPath(cpuData, 60)}
                stroke="rgba(34, 211, 238, 0.8)"
                strokeWidth="2"
                fill="none"
              />
              <path
                d={getPath(cpuData, 60)}
                stroke="transparent"
                strokeWidth="0"
                fill="url(#cpuGradient)"
                opacity="0.4"
              />
              <defs>
                <linearGradient id="cpuGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(34, 211, 238, 0.4)" />
                  <stop offset="100%" stopColor="rgba(34, 211, 238, 0)" />
                </linearGradient>
              </defs>
            </svg>
            
            <div className="absolute bottom-0 left-0 w-full grid grid-cols-5 gap-0">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="border-t border-cyan-500/10 text-right pt-1">
                  <span className="text-xs text-gray-500">{i * 25}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Memory Status */}
        <div className="bg-gray-900/50 rounded-lg border border-purple-500/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mr-3">
                <HardDrive className="text-purple-400" size={18} />
              </div>
              <div>
                <h3 className="font-medium text-white">Memory</h3>
                <p className="text-xs text-gray-400">32GB DDR5-5200</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-purple-400">68%</span>
              <div className="flex items-center text-xs text-gray-400">
                <ChevronsUpDown size={12} className="mr-1" />
                <span>21.8 GB</span>
              </div>
            </div>
          </div>
          
          <div className="relative h-16">
            <svg className="w-full h-full">
              <path
                d={getPath(memoryData, 60)}
                stroke="rgba(162, 28, 175, 0.8)"
                strokeWidth="2"
                fill="none"
              />
              <path
                d={getPath(memoryData, 60)}
                stroke="transparent"
                strokeWidth="0"
                fill="url(#memoryGradient)"
                opacity="0.4"
              />
              <defs>
                <linearGradient id="memoryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(162, 28, 175, 0.4)" />
                  <stop offset="100%" stopColor="rgba(162, 28, 175, 0)" />
                </linearGradient>
              </defs>
            </svg>
            
            <div className="absolute bottom-0 left-0 w-full grid grid-cols-5 gap-0">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="border-t border-purple-500/10 text-right pt-1">
                  <span className="text-xs text-gray-500">{i * 25}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* GPU Status */}
        <div className="bg-gray-900/50 rounded-lg border border-red-500/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center mr-3">
                <Fan className="text-red-400" size={18} />
              </div>
              <div>
                <h3 className="font-medium text-white">GPU</h3>
                <p className="text-xs text-gray-400">NVIDIA RTX 4080</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-red-400">54%</span>
              <div className="flex items-center text-xs text-gray-400">
                <Thermometer size={12} className="mr-1" />
                <span>68°C</span>
              </div>
            </div>
          </div>
          
          <div className="flex w-full h-4 bg-gray-700/50 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-xs text-white"
              style={{ width: '54%' }}
            >
              8.6 GB
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-gray-800/80 rounded p-2">
              <div className="text-xs text-gray-400">Core Clock</div>
              <div className="text-sm font-medium">1980 MHz</div>
            </div>
            <div className="bg-gray-800/80 rounded p-2">
              <div className="text-xs text-gray-400">Memory Clock</div>
              <div className="text-sm font-medium">16000 MHz</div>
            </div>
          </div>
        </div>
        
        {/* Network Status */}
        <div className="bg-gray-900/50 rounded-lg border border-green-500/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mr-3">
                <svg className="text-green-400" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M20 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M8 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 4L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 16L12 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white">Network</h3>
                <p className="text-xs text-gray-400">Optimized Route</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-green-400">24 ms</span>
              <div className="flex items-center text-xs text-gray-400">
                <span>Packet Loss: 0.2%</span>
              </div>
            </div>
          </div>
          
          <div className="relative h-16">
            <svg className="w-full h-full">
              <path
                d={getPath(networkData, 60)}
                stroke="rgba(74, 222, 128, 0.8)"
                strokeWidth="2"
                fill="none"
              />
              <path
                d={getPath(networkData, 60)}
                stroke="transparent"
                strokeWidth="0"
                fill="url(#networkGradient)"
                opacity="0.4"
              />
              <defs>
                <linearGradient id="networkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(74, 222, 128, 0.4)" />
                  <stop offset="100%" stopColor="rgba(74, 222, 128, 0)" />
                </linearGradient>
              </defs>
            </svg>
            
            <div className="absolute bottom-0 left-0 w-full grid grid-cols-5 gap-0">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="border-t border-green-500/10 text-right pt-1">
                  <span className="text-xs text-gray-500">{i * 25}ms</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};