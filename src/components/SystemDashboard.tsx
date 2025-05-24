import React, { useState, useEffect, useRef } from 'react';
import { useSystemMonitor } from '../hooks/useSystemMonitor';
import { Cpu, MemoryStick as Memory, Fan, Thermometer, Activity, Server, RefreshCw, AlertTriangle, Zap, Clock, BarChart4 } from 'lucide-react';

interface SystemDashboardProps {
  refreshRate?: number;
  showHistory?: boolean;
  showAlerts?: boolean;
  layout?: 'grid' | 'compact';
  height?: number;
  className?: string;
}

export const SystemDashboard: React.FC<SystemDashboardProps> = ({
  refreshRate = 2000,
  showHistory = true,
  showAlerts = true,
  layout = 'grid',
  height = 400,
  className = ''
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
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'cpu' | 'memory' | 'gpu' | 'network'>('overview');
  const [alerts, setAlerts] = useState<Array<{component: string; message: string; severity: string}>>([]);
  const historyCanvasRef = useRef<HTMLCanvasElement>(null);

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

  // Format seconds to human-readable uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds % 60}s`;
  };

  // Run diagnostics
  const handleRunDiagnostics = async () => {
    try {
      setIsDiagnosticRunning(true);
      const results = await runDiagnostics();
      setDiagnosticResults(results);
      
      // Extract alerts from diagnostic results
      if (results && results.issues) {
        setAlerts(results.issues.map((issue: any) => ({
          component: issue.component,
          message: issue.message,
          severity: issue.severity
        })));
      }
    } catch (error) {
      console.error('Error running diagnostics:', error);
    } finally {
      setIsDiagnosticRunning(false);
    }
  };

  // Draw performance history chart
  useEffect(() => {
    if (!showHistory || metricsHistory.length === 0 || !historyCanvasRef.current) return;
    
    const canvas = historyCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set dimensions
    const width = canvas.width;
    const height = canvas.height;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Draw background grid
    ctx.strokeStyle = 'rgba(75, 85, 99, 0.2)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines (25%, 50%, 75%, 100%)
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      
      // Add percentage labels
      ctx.fillStyle = 'rgba(156, 163, 175, 0.7)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${100 - i * 25}%`, padding - 5, y + 3);
    }
    
    // Draw data lines
    const drawLine = (data: number[], color: string) => {
      if (data.length < 2) return;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const step = chartWidth / (data.length - 1);
      
      for (let i = 0; i < data.length; i++) {
        const x = padding + i * step;
        const y = padding + chartHeight - (chartHeight * data[i]) / 100;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
    };
    
    // Extract data series
    const cpuData = metricsHistory.map(m => m.cpu.usage);
    const memoryData = metricsHistory.map(m => m.memory.usage);
    const gpuData = metricsHistory.map(m => m.gpu.usage);
    
    // Draw lines
    drawLine(cpuData, 'rgba(6, 182, 212, 0.8)'); // Cyan for CPU
    drawLine(memoryData, 'rgba(168, 85, 247, 0.8)'); // Purple for Memory
    drawLine(gpuData, 'rgba(239, 68, 68, 0.8)'); // Red for GPU
    
    // Draw legend
    const legendY = height - 10;
    const legendSpacing = 80;
    
    // CPU legend
    ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
    ctx.fillRect(padding, legendY, 10, 2);
    ctx.fillStyle = 'rgba(156, 163, 175, 0.7)';
    ctx.fillText('CPU', padding + 15, legendY + 3);
    
    // Memory legend
    ctx.fillStyle = 'rgba(168, 85, 247, 0.8)';
    ctx.fillRect(padding + legendSpacing, legendY, 10, 2);
    ctx.fillStyle = 'rgba(156, 163, 175, 0.7)';
    ctx.fillText('Memory', padding + legendSpacing + 15, legendY + 3);
    
    // GPU legend
    ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.fillRect(padding + legendSpacing * 2, legendY, 10, 2);
    ctx.fillStyle = 'rgba(156, 163, 175, 0.7)';
    ctx.fillText('GPU', padding + legendSpacing * 2 + 15, legendY + 3);
    
  }, [metricsHistory, showHistory]);

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

  // Get background color based on severity
  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 border-red-500/50';
      case 'high': return 'bg-orange-500/10 border-orange-500/50';
      case 'medium': return 'bg-yellow-500/10 border-yellow-500/50';
      default: return 'bg-blue-500/10 border-blue-500/50';
    }
  };

  // Get text color based on severity
  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  if (isLoading && !currentMetrics) {
    return (
      <div className={`bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-6 flex items-center justify-center ${className}`}>
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mr-3"></div>
        <p className="text-gray-400">Loading system information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-500/10 border border-red-500/50 rounded-lg p-6 ${className}`}>
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

  // Compact view
  if (layout === 'compact') {
    return (
      <div className={`bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-white flex items-center">
            <Activity className="mr-2 text-cyan-400" size={20} />
            System Performance
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={refreshHardwareInfo}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className={`p-1.5 rounded-lg transition-colors ${
                isMonitoring 
                  ? 'bg-red-500 hover:bg-red-400 text-white' 
                  : 'bg-green-500 hover:bg-green-400 text-white'
              }`}
              title={isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            >
              {isMonitoring ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="6" width="12" height="12" fill="currentColor" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5.14v14.72L19 12 8 5.14z" fill="currentColor" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* CPU */}
          <div className="bg-gray-900/70 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Cpu className="text-cyan-400 mr-1.5" size={14} />
                <span className="text-xs text-gray-400">CPU</span>
              </div>
              <span className={`text-sm font-medium ${getUsageColor(hardwareInfo?.cpu.usage || 0)}`}>
                {hardwareInfo?.cpu.usage.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${hardwareInfo?.cpu.usage || 0}%` }}
              />
            </div>
          </div>
          
          {/* Memory */}
          <div className="bg-gray-900/70 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Memory className="text-purple-400 mr-1.5" size={14} />
                <span className="text-xs text-gray-400">Memory</span>
              </div>
              <span className={`text-sm font-medium ${getUsageColor(hardwareInfo?.memory.usage || 0)}`}>
                {hardwareInfo?.memory.usage.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                style={{ width: `${hardwareInfo?.memory.usage || 0}%` }}
              />
            </div>
          </div>
          
          {/* GPU */}
          <div className="bg-gray-900/70 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Fan className="text-red-400 mr-1.5" size={14} />
                <span className="text-xs text-gray-400">GPU</span>
              </div>
              <span className={`text-sm font-medium ${getUsageColor(hardwareInfo?.gpu.usage || 0)}`}>
                {hardwareInfo?.gpu.usage.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
                style={{ width: `${hardwareInfo?.gpu.usage || 0}%` }}
              />
            </div>
          </div>
          
          {/* Temperature */}
          <div className="bg-gray-900/70 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Thermometer className="text-green-400 mr-1.5" size={14} />
                <span className="text-xs text-gray-400">Temp</span>
              </div>
              <span className={`text-sm font-medium ${getTemperatureColor(hardwareInfo?.cpu.temperature)}`}>
                {hardwareInfo?.cpu.temperature ? `${hardwareInfo.cpu.temperature.toFixed(1)}°C` : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">CPU</span>
              <span className={`${getTemperatureColor(hardwareInfo?.cpu.temperature)}`}>
                {hardwareInfo?.cpu.temperature ? `${hardwareInfo.cpu.temperature.toFixed(1)}°C` : 'N/A'}
              </span>
              <span className="text-gray-500">GPU</span>
              <span className={`${getTemperatureColor(hardwareInfo?.gpu.temperature)}`}>
                {hardwareInfo?.gpu.temperature ? `${hardwareInfo.gpu.temperature.toFixed(1)}°C` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Alerts */}
        {showAlerts && alerts.length > 0 && (
          <div className="mt-3 space-y-2">
            {alerts.slice(0, 2).map((alert, index) => (
              <div 
                key={index} 
                className={`p-2 rounded-lg border ${getSeverityBgColor(alert.severity)}`}
              >
                <div className="flex items-center">
                  <AlertTriangle className={`${getSeverityTextColor(alert.severity)} mr-1.5`} size={14} />
                  <span className={`text-xs ${getSeverityTextColor(alert.severity)}`}>
                    {alert.component}: {alert.message}
                  </span>
                </div>
              </div>
            ))}
            {alerts.length > 2 && (
              <div className="text-xs text-gray-400 text-center">
                +{alerts.length - 2} more alerts
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full grid view
  return (
    <div className={`space-y-6 ${className}`}>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <p className="text-xs text-gray-400">{formatBytes(hardwareInfo?.memory.total || 0)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xl font-bold ${getUsageColor(hardwareInfo?.memory.usage || 0)}`}>
                {hardwareInfo?.memory.usage.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-400">
                {formatBytes(hardwareInfo?.memory.used || 0)} used
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
                <div className="font-medium text-white">{formatBytes(hardwareInfo?.memory.total || 0)}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-400">Available</div>
                <div className="font-medium text-white">{formatBytes(hardwareInfo?.memory.available || 0)}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-400">Used</div>
                <div className="font-medium text-white">{formatBytes(hardwareInfo?.memory.used || 0)}</div>
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
                <div className="font-medium text-white">{formatBytes(hardwareInfo?.gpu.memory.total || 0)}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="text-xs text-gray-400">VRAM Used</div>
                <div className="font-medium text-white">{formatBytes(hardwareInfo?.gpu.memory.used || 0)}</div>
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
                {formatUptime(hardwareInfo?.system.uptime || 0)}
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
      {showHistory && (
        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white flex items-center">
              <BarChart4 className="mr-2 text-cyan-400" size={20} />
              Performance History
            </h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-xs text-gray-400">
                <div className="w-3 h-1 bg-cyan-500 mr-1"></div>
                <span>CPU</span>
              </div>
              <div className="flex items-center text-xs text-gray-400">
                <div className="w-3 h-1 bg-purple-500 mr-1"></div>
                <span>Memory</span>
              </div>
              <div className="flex items-center text-xs text-gray-400">
                <div className="w-3 h-1 bg-red-500 mr-1"></div>
                <span>GPU</span>
              </div>
            </div>
          </div>
          
          <div className="h-64 relative">
            <canvas 
              ref={historyCanvasRef} 
              width="800" 
              height="300" 
              className="w-full h-full"
            ></canvas>
          </div>
        </div>
      )}

      {/* System Alerts (if enabled and there are issues) */}
      {showAlerts && alerts.length > 0 && (
        <div className="bg-gray-800/60 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <AlertTriangle className="text-yellow-400 mr-2" size={20} />
            System Alerts
          </h3>
          
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border ${getSeverityBgColor(alert.severity)}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white font-medium">{alert.component}</h4>
                    <p className="text-gray-300 text-sm">{alert.message}</p>
                  </div>
                  <div className={`px-2 py-0.5 text-xs rounded-full ${
                    alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                    alert.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {alert.severity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Optimization Tips */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <Zap className="text-cyan-400 mr-2" size={20} />
          Performance Optimization
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900/70 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <Cpu className="text-cyan-400 mr-2" size={16} />
              <h4 className="text-sm font-medium text-white">CPU Optimization</h4>
            </div>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Close unnecessary background applications</li>
              <li>• Set game process priority to High</li>
              <li>• Disable CPU-intensive startup programs</li>
              <li>• Ensure proper cooling for optimal performance</li>
            </ul>
          </div>
          
          <div className="bg-gray-900/70 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <Memory className="text-purple-400 mr-2" size={16} />
              <h4 className="text-sm font-medium text-white">Memory Management</h4>
            </div>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Close memory-intensive applications</li>
              <li>• Optimize virtual memory settings</li>
              <li>• Use memory cleaner before gaming</li>
              <li>• Consider upgrading RAM for better performance</li>
            </ul>
          </div>
          
          <div className="bg-gray-900/70 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <Fan className="text-red-400 mr-2" size={16} />
              <h4 className="text-sm font-medium text-white">GPU Optimization</h4>
            </div>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Update graphics drivers regularly</li>
              <li>• Optimize in-game graphics settings</li>
              <li>• Monitor GPU temperatures during gaming</li>
              <li>• Consider undervolting for better efficiency</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Real-time Performance Metrics */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white flex items-center">
            <Clock className="text-green-400 mr-2" size={20} />
            Real-time Metrics
          </h3>
          <div className="text-xs text-gray-400">
            Updated every {refreshRate/1000}s
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-900/70 rounded-lg p-3">
            <div className="text-xs text-gray-400">CPU Usage</div>
            <div className={`text-lg font-medium ${getUsageColor(currentMetrics?.performance.cpu.usage || 0)}`}>
              {currentMetrics?.performance.cpu.usage.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-gray-900/70 rounded-lg p-3">
            <div className="text-xs text-gray-400">Memory Usage</div>
            <div className={`text-lg font-medium ${getUsageColor(currentMetrics?.performance.memory.usage || 0)}`}>
              {currentMetrics?.performance.memory.usage.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-gray-900/70 rounded-lg p-3">
            <div className="text-xs text-gray-400">GPU Usage</div>
            <div className={`text-lg font-medium ${getUsageColor(currentMetrics?.performance.gpu.usage || 0)}`}>
              {currentMetrics?.performance.gpu.usage.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-gray-900/70 rounded-lg p-3">
            <div className="text-xs text-gray-400">CPU Temperature</div>
            <div className={`text-lg font-medium ${getTemperatureColor(currentMetrics?.performance.cpu.temperature)}`}>
              {currentMetrics?.performance.cpu.temperature 
                ? `${currentMetrics.performance.cpu.temperature.toFixed(1)}°C` 
                : 'N/A'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};