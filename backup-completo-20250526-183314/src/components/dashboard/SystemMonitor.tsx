import React, { useState, useEffect } from 'react';
import { Cpu, MemoryStick as Memory, Fan, Network } from 'lucide-react';

export const SystemMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState({
    cpu: {
      usage: 42,
      temperature: 62,
      model: 'Intel Core i7-12700K'
    },
    memory: {
      usage: 68,
      total: '32GB DDR5-5200',
      used: '21.8 GB'
    },
    gpu: {
      usage: 54,
      temperature: 68,
      model: 'NVIDIA RTX 4080',
      memory: {
        used: '8.6 GB',
        total: '16 GB'
      },
      clocks: {
        core: 1980,
        memory: 16000
      }
    },
    network: {
      latency: 24,
      packetLoss: 0.2,
      route: 'Optimized Route'
    }
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: {
          ...prev.cpu,
          usage: Math.min(100, Math.max(0, prev.cpu.usage + (Math.random() * 10 - 5))),
          temperature: Math.min(90, Math.max(50, prev.cpu.temperature + (Math.random() * 4 - 2)))
        },
        memory: {
          ...prev.memory,
          usage: Math.min(100, Math.max(0, prev.memory.usage + (Math.random() * 8 - 4)))
        },
        gpu: {
          ...prev.gpu,
          usage: Math.min(100, Math.max(0, prev.gpu.usage + (Math.random() * 12 - 6))),
          temperature: Math.min(85, Math.max(45, prev.gpu.temperature + (Math.random() * 4 - 2)))
        },
        network: {
          ...prev.network,
          latency: Math.max(1, prev.network.latency + (Math.random() * 6 - 3)),
          packetLoss: Math.max(0, prev.network.packetLoss + (Math.random() * 0.2 - 0.1))
        }
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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
                <p className="text-xs text-gray-400">{metrics.cpu.model}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-cyan-400">{Math.round(metrics.cpu.usage)}%</span>
              <div className="flex items-center text-xs text-gray-400">
                <span>{metrics.cpu.temperature}°C</span>
              </div>
            </div>
          </div>
          
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-500 transition-all duration-500"
              style={{ width: `${metrics.cpu.usage}%` }}
            />
          </div>
        </div>
        
        {/* Memory Status */}
        <div className="bg-gray-900/50 rounded-lg border border-purple-500/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mr-3">
                <Memory className="text-purple-400" size={18} />
              </div>
              <div>
                <h3 className="font-medium text-white">Memory</h3>
                <p className="text-xs text-gray-400">{metrics.memory.total}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-purple-400">{Math.round(metrics.memory.usage)}%</span>
              <div className="flex items-center text-xs text-gray-400">
                <span>{metrics.memory.used}</span>
              </div>
            </div>
          </div>
          
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 transition-all duration-500"
              style={{ width: `${metrics.memory.usage}%` }}
            />
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
                <p className="text-xs text-gray-400">{metrics.gpu.model}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-red-400">{Math.round(metrics.gpu.usage)}%</span>
              <div className="flex items-center text-xs text-gray-400">
                <span>{metrics.gpu.temperature}°C</span>
              </div>
            </div>
          </div>
          
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-red-500 transition-all duration-500"
              style={{ width: `${metrics.gpu.usage}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800/80 rounded p-2">
              <div className="text-xs text-gray-400">Core Clock</div>
              <div className="text-sm font-medium">{metrics.gpu.clocks.core} MHz</div>
            </div>
            <div className="bg-gray-800/80 rounded p-2">
              <div className="text-xs text-gray-400">Memory Clock</div>
              <div className="text-sm font-medium">{metrics.gpu.clocks.memory} MHz</div>
            </div>
          </div>
        </div>
        
        {/* Network Status */}
        <div className="bg-gray-900/50 rounded-lg border border-green-500/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mr-3">
                <Network className="text-green-400" size={18} />
              </div>
              <div>
                <h3 className="font-medium text-white">Network</h3>
                <p className="text-xs text-gray-400">{metrics.network.route}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-green-400">{Math.round(metrics.network.latency)} ms</span>
              <div className="flex items-center text-xs text-gray-400">
                <span>Loss: {metrics.network.packetLoss.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${100 - (metrics.network.latency / 100 * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};