import React, { useState } from 'react';
import { SystemDashboard } from '../components/SystemDashboard';
import { Activity, Download, Zap, AlertCircle } from 'lucide-react';

export const SystemMonitoring: React.FC = () => {
  const [refreshRate, setRefreshRate] = useState(2000);
  const [showHistory, setShowHistory] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [layout, setLayout] = useState<'grid' | 'compact'>('grid');
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-cyan-500/20 rounded-lg overflow-hidden p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">System Monitoring</h1>
            <p className="text-gray-400 mt-1">
              Real-time hardware monitoring and performance analysis
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-gray-700/50 rounded-lg px-4 py-2 flex items-center">
              <Activity className="text-cyan-400 mr-2" size={18} />
              <div>
                <div className="text-xs text-gray-400">Refresh Rate</div>
                <select 
                  value={refreshRate}
                  onChange={(e) => setRefreshRate(Number(e.target.value))}
                  className="bg-transparent text-white text-sm focus:outline-none"
                >
                  <option value={1000}>1 second</option>
                  <option value={2000}>2 seconds</option>
                  <option value={5000}>5 seconds</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showHistory"
              checked={showHistory}
              onChange={(e) => setShowHistory(e.target.checked)}
              className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500 focus:ring-2"
            />
            <label htmlFor="showHistory" className="ml-2 text-sm text-gray-300">
              Show Performance History
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showAlerts"
              checked={showAlerts}
              onChange={(e) => setShowAlerts(e.target.checked)}
              className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500 focus:ring-2"
            />
            <label htmlFor="showAlerts" className="ml-2 text-sm text-gray-300">
              Show System Alerts
            </label>
          </div>
          
          <div className="flex items-center">
            <label htmlFor="layout" className="text-sm text-gray-300 mr-2">
              Layout:
            </label>
            <select
              id="layout"
              value={layout}
              onChange={(e) => setLayout(e.target.value as 'grid' | 'compact')}
              className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="grid">Grid</option>
              <option value="compact">Compact</option>
            </select>
          </div>
        </div>
      </div>

      {/* System Dashboard */}
      <SystemDashboard 
        refreshRate={refreshRate}
        showHistory={showHistory}
        showAlerts={showAlerts}
        layout={layout}
      />

      {/* Performance Tips */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
        <h2 className="text-lg font-medium text-white mb-4">Performance Tips</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900/70 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center mr-2">
                <Zap className="text-cyan-400" size={18} />
              </div>
              <h3 className="text-white font-medium">CPU Optimization</h3>
            </div>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Close unnecessary background applications</li>
              <li>• Set game process priority to High</li>
              <li>• Update CPU drivers and BIOS</li>
              <li>• Check for thermal throttling</li>
            </ul>
          </div>
          
          <div className="bg-gray-900/70 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mr-2">
                <Download className="text-purple-400" size={18} />
              </div>
              <h3 className="text-white font-medium">Memory Management</h3>
            </div>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Close memory-intensive applications</li>
              <li>• Disable startup programs</li>
              <li>• Optimize virtual memory settings</li>
              <li>• Consider adding more RAM if consistently high</li>
            </ul>
          </div>
          
          <div className="bg-gray-900/70 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center mr-2">
                <AlertCircle className="text-red-400" size={18} />
              </div>
              <h3 className="text-white font-medium">Temperature Control</h3>
            </div>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Ensure proper airflow in your case</li>
              <li>• Clean dust from fans and heatsinks</li>
              <li>• Consider upgrading cooling solutions</li>
              <li>• Use cooling pads for laptops</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};