import React, { useState, useEffect } from 'react';
import { useSystemMonitor } from '../hooks/useSystemMonitor';
import { Cpu, Memory, Fan, Thermometer, Activity, Server, RefreshCw, AlertTriangle } from 'lucide-react';

interface SystemDashboardProps {
  refreshRate?: number;
  showHistory?: boolean;
  showAlerts?: boolean;
  layout?: 'grid' | 'compact';
}

export const SystemDashboard: React.FC<SystemDashboardProps> = ({
  refreshRate = 2000,
  showHistory = true,
  showAlerts = true,
  layout = 'grid'
}) => {
  const {
    isMonitoring,
    isLoading,
    error,
    currentMetrics,
    metricsHistory,
    hardwareInfo,
    startMonitoring,
    stopMonitoring,
    refreshHardwareInfo,
    runDiagnostics
  } = useSystemMonitor({
    interval: refreshRate,
    autoStart: true,
    historySize: 60
  });

  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);

  // Format bytes to human-readable format
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Format MHz to GHz
  const formatFrequency = (mhz: number) => {
    return (mhz / 1000).toFixed(2) + ' GHz';
  };

  // Run diagnostics
  const handleRunDiagnostics = async () => {
    try {
      setIsDiagnosticRunning(true);
      const results = await runDiagnostics();
      setDiagnosticResults(results);
    } catch (error) {
      console.error('Error running diagnostics:', error);
    } finally {
      setIsDiagnosticRunning(false);
    }
  };

  // Get color based on usage percentage
  const getUsageColor = (usage: number) => {
    if (usage < 50) return 'text-green-400';
    if (usage < 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get color based on temperature
  const getTemperatureColor = (temp?: number) => {
    if (!temp) return 'text-gray-400';
    if (temp < 60) return 'text-green-400';
    if (temp < 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (isLoading && !currentMetrics) {
    return (
      <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mr-3"></div>
        <p className="text-gray-400">Loading system information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="text-red-400 mr-3" size={24} />
          <h3 className="text-lg font-medium text-white">Error Loading System Information</h3>
        </div>
        <p className="text-gray-300 mb-4">{error}</p>
        <button
          onClick={refreshHardwareInfo}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center"
        >
          <RefreshCw size={16} className="mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with system info */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-white">System Information</h2>
            <p className="text-gray-400 text-sm">
              {hardwareInfo?.system.manufacturer} {hardwareInfo?.system.model} - {hardwareInfo?.system.os} {hardwareInfo?.system.version}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={refreshHardwareInfo}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center text-sm"
            >
              <RefreshCw size={14} className="mr-1.5" />
              Refresh
            </button>
            <button
              onClick={handleRunDiagnostics}
              disabled={isDiagnosticRunning}
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg transition-colors flex items-center text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDiagnosticRunning ? (
                <>
                  <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin mr-1.5"></div>
                  Running...
                </>
              ) : (
                <>
                  <Activity size={14} className="mr-1.5" />
                  Diagnostics
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main metrics grid */}
      <div className={`grid ${layout === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'} gap-4`}>
        {/* CPU Card */}
        <div className="bg-gray-800/60 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center mr-3">
                <Cpu className="text-cyan-400" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-white">CPU</h3>
                <p className="text-xs text-gray-400">{hardwareInfo?.cpu.name}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xl font-bold ${getUsageColor(hardwareInfo?.cpu.usage || 0)}`}>
                {hardwareInfo?.cpu.usage.toFixed(1)}%
              </div>
              <div className="flex items-center text-xs text-gray-400">
                <Thermometer size={12} className="mr-1" />
                <span className={getTemperatureColor(hardwareInfo?.cpu.temperature)}>
                  {hardwareInfo?.cpu.temperature ? `${hardwareInfo.cpu.temperature.toFixed(1)}°C` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Usage</span>
                <span>{hardwareInfo?.cpu.usage.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${hardwareInfo?.cpu.usage || 0}%` }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-400">Cores</div>
                <div className="font-medium text-white">{hardwareInfo?.cpu.cores}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-400">Threads</div>
                <div className="font-medium text-white">{hardwareInfo?.cpu.threads}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-400">Base Speed</div>
                <div className="font-medium text-white">{formatFrequency(hardwareInfo?.cpu.baseSpeed || 0)}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-400">Current Speed</div>
                <div className="font-medium text-white">{formatFrequency(hardwareInfo?.cpu.currentSpeed || 0)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Memory Card */}
        <div className="bg-gray-800/60 backdrop-blur-sm border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mr-3">
                <Memory className="text-purple-400" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-white">Memory</h3>
                <p className="text-xs text-gray-400">{formatBytes(hardwareInfo?.memory.total || 0 * 1024 * 1024)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xl font-bold ${getUsageColor(hardwareInfo?.memory.usage || 0)}`}>
                {hardwareInfo?.memory.usage.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-400">
                {formatBytes(hardwareInfo?.memory.used || 0 * 1024 * 1024)} used
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Usage</span>
                <span>{hardwareInfo?.memory.usage.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                  style={{ width: `${hardwareInfo?.memory.usage || 0}%` }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-400">Total</div>
                <div className="font-medium text-white">{formatBytes(hardwareInfo?.memory.total || 0 * 1024 * 1024)}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-400">Available</div>
                <div className="font-medium text-white">{formatBytes(hardwareInfo?.memory.available || 0 * 1024 * 1024)}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-400">Used</div>
                <div className="font-medium text-white">{formatBytes(hardwareInfo?.memory.used || 0 * 1024 * 1024)}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-400">Usage</div>
                <div className="font-medium text-white">{hardwareInfo?.memory.usage.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* GPU Card */}
        <div className="bg-gray-800/60 backdrop-blur-sm border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center mr-3">
                <Fan className="text-red-400" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-white">GPU</h3>
                <p className="text-xs text-gray-400">{hardwareInfo?.gpu.name}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xl font-bold ${getUsageColor(hardwareInfo?.gpu.usage || 0)}`}>
                {hardwareInfo?.gpu.usage.toFixed(1)}%
              </div>
              <div className="flex items-center text-xs text-gray-400">
                <Thermometer size={12} className="mr-1" />
                <span className={getTemperatureColor(hardwareInfo?.gpu.temperature)}>
                  {hardwareInfo?.gpu.temperature ? `${hardwareInfo.gpu.temperature.toFixed(1)}°C` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Usage</span>
                <span>{hardwareInfo?.gpu.usage.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
                  style={{ width: `${hardwareInfo?.gpu.usage || 0}%` }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-400">Vendor</div>
                <div className="font-medium text-white">{hardwareInfo?.gpu.vendor}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-400">Driver</div>
                <div className="font-medium text-white">{hardwareInfo?.gpu.driverVersion || 'N/A'}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-400">VRAM Total</div>
                <div className="font-medium text-white">{formatBytes(hardwareInfo?.gpu.memory.total || 0 * 1024 * 1024)}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-400">VRAM Used</div>
                <div className="font-medium text-white">{formatBytes(hardwareInfo?.gpu.memory.used || 0 * 1024 * 1024)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* System Card */}
        <div className="bg-gray-800/60 backdrop-blur-sm border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mr-3">
                <Server className="text-green-400" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-white">System</h3>
                <p className="text-xs text-gray-400">{hardwareInfo?.system.os}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green-400">
                {Math.floor(hardwareInfo?.system.uptime || 0 / 3600)}h {Math.floor((hardwareInfo?.system.uptime || 0 % 3600) / 60)}m
              </div>
              <div className="text-xs text-gray-400">Uptime</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-400">Manufacturer</div>
                <div className="font-medium text-white">{hardwareInfo?.system.manufacturer}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-400">Model</div>
                <div className="font-medium text-white">{hardwareInfo?.system.model}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-400">OS</div>
                <div className="font-medium text-white">{hardwareInfo?.system.os}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-400">Version</div>
                <div className="font-medium text-white">{hardwareInfo?.system.version}</div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center ${
                  isMonitoring 
                    ? 'bg-red-500 hover:bg-red-400 text-white' 
                    : 'bg-green-500 hover:bg-green-400 text-white'
                }`}
              >
                {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
              </button>
              
              <div className="flex items-center text-xs text-gray-400">
                <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-500'} mr-1.5`}></div>
                {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance History (if enabled) */}
      {showHistory && metricsHistory.length > 0 && (
        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-4">Performance History</h3>
          
          <div className="h-64 relative">
            {/* Simple line chart for CPU, Memory, and GPU usage */}
            <svg className="w-full h-full" viewBox={`0 0 ${metricsHistory.length} 100`}>
              {/* CPU usage line */}
              <polyline
                points={metricsHistory.map((metric, i) => `${i},${100 - metric.cpu.usage}`).join(' ')}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
              />
              
              {/* Memory usage line */}
              <polyline
                points={metricsHistory.map((metric, i) => `${i},${100 - metric.memory.usage}`).join(' ')}
                fill="none"
                stroke="#a855f7"
                strokeWidth="2"
              />
              
              {/* GPU usage line */}
              <polyline
                points={metricsHistory.map((metric, i) => `${i},${100 - metric.gpu.usage}`).join(' ')}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
              />
            </svg>
            
            {/* Legend */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-1 bg-cyan-500 mr-1"></div>
                <span className="text-gray-400">CPU</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-1 bg-purple-500 mr-1"></div>
                <span className="text-gray-400">Memory</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-1 bg-red-500 mr-1"></div>
                <span className="text-gray-400">GPU</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Alerts (if enabled and there are issues) */}
      {showAlerts && diagnosticResults && diagnosticResults.issues && diagnosticResults.issues.length > 0 && (
        <div className="bg-gray-800/60 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <AlertTriangle className="text-yellow-400 mr-2" size={20} />
            System Alerts
          </h3>
          
          <div className="space-y-3">
            {diagnosticResults.issues.map((issue: any, index: number) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border ${
                  issue.severity === 'critical' ? 'border-red-500/50 bg-red-500/10' :
                  issue.severity === 'high' ? 'border-orange-500/50 bg-orange-500/10' :
                  'border-yellow-500/50 bg-yellow-500/10'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white font-medium">{issue.component}</h4>
                    <p className="text-gray-300 text-sm">{issue.message}</p>
                  </div>
                  <div className={`px-2 py-0.5 text-xs rounded-full ${
                    issue.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                    issue.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {issue.severity}
                  </div>
                </div>
                {issue.recommendation && (
                  <p className="text-gray-400 text-xs mt-1">
                    Recommendation: {issue.recommendation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diagnostic Results */}
      {diagnosticResults && (
        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-4">Diagnostic Results</h3>
          
          {/* Top Processes */}
          {diagnosticResults.processes && diagnosticResults.processes.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-white mb-2">Top Processes</h4>
              <div className="bg-gray-900/70 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-800/80">
                      <th className="py-2 px-3 text-left text-xs font-medium text-gray-400">Name</th>
                      <th className="py-2 px-3 text-right text-xs font-medium text-gray-400">CPU</th>
                      <th className="py-2 px-3 text-right text-xs font-medium text-gray-400">Memory</th>
                      <th className="py-2 px-3 text-right text-xs font-medium text-gray-400">PID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diagnosticResults.processes.map((process: any, index: number) => (
                      <tr key={index} className="border-t border-gray-800">
                        <td className="py-2 px-3 text-gray-300">{process.name}</td>
                        <td className="py-2 px-3 text-right text-gray-300">{process.cpuUsage.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right text-gray-300">{formatBytes(process.memoryUsage * 1024 * 1024)}</td>
                        <td className="py-2 px-3 text-right text-gray-400">{process.pid}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Network Performance */}
          {diagnosticResults.network && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-white mb-2">Network Performance</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-900/70 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Download</div>
                  <div className="text-lg font-medium text-white">{diagnosticResults.network.download.toFixed(1)} Mbps</div>
                </div>
                <div className="bg-gray-900/70 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Upload</div>
                  <div className="text-lg font-medium text-white">{diagnosticResults.network.upload.toFixed(1)} Mbps</div>
                </div>
                <div className="bg-gray-900/70 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Latency</div>
                  <div className="text-lg font-medium text-white">{diagnosticResults.network.latency.toFixed(1)} ms</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};