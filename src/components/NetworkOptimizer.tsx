// src/components/NetworkOptimizer.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Activity, Globe, AlertTriangle, CheckCircle } from 'lucide-react';
import { NetworkAnalyzer, NetworkAnalysis, NetworkIssue } from '../lib/networkAI';
import { useTranslation } from 'react-i18next';

export const NetworkOptimizer: React.FC = () => {
  const { t } = useTranslation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<NetworkAnalysis | null>(null);
  const [selectedGame, setSelectedGame] = useState<string>('');
  
  const analyzer = new NetworkAnalyzer();

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // Analyze connection to Google DNS as test
      const result = await analyzer.analyzeConnection('8.8.8.8');
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
    setIsAnalyzing(false);
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 30) return 'text-green-500';
    if (latency < 60) return 'text-yellow-500';
    if (latency < 100) return 'text-orange-500';
    return 'text-red-500';
  };

  const getLatencyLabel = (latency: number) => {
    if (latency < 30) return 'Excellent';
    if (latency < 60) return 'Good';
    if (latency < 100) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Wifi className="w-6 h-6" />
          Network Optimizer
        </h2>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Activity className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Activity className="w-4 h-4" />
              Analyze Network
            </>
          )}
        </motion.button>
      </div>

      {/* Game Selection */}
      <div className="bg-gray-800 rounded-lg p-4">
        <label className="block text-sm font-medium mb-2">Select Game for Optimization</label>
        <select 
          value={selectedGame}
          onChange={(e) => setSelectedGame(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select a Game --</option>
          <option value="cs2">Counter-Strike 2</option>
          <option value="valorant">Valorant</option>
          <option value="lol">League of Legends</option>
          <option value="overwatch">Overwatch 2</option>
          <option value="fortnite">Fortnite</option>
        </select>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Latency Card */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Latency</h3>
              <Globe className="w-5 h-5 text-gray-400" />
            </div>
            <div className={`text-3xl font-bold ${getLatencyColor(analysis.latency)}`}>
              {Math.round(analysis.latency)}ms
            </div>
            <p className="text-sm text-gray-400 mt-1">{getLatencyLabel(analysis.latency)}</p>
          </div>

          {/* Jitter Card */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Jitter</h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <div className={`text-3xl font-bold ${analysis.jitter < 5 ? 'text-green-500' : 'text-yellow-500'}`}>
              {analysis.jitter.toFixed(1)}ms
            </div>
            <p className="text-sm text-gray-400 mt-1">Stability</p>
          </div>

          {/* Packet Loss Card */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Packet Loss</h3>
              <AlertTriangle className="w-5 h-5 text-gray-400" />
            </div>
            <div className={`text-3xl font-bold ${analysis.packetLoss === 0 ? 'text-green-500' : 'text-red-500'}`}>
              {analysis.packetLoss.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-400 mt-1">Loss Rate</p>
          </div>
        </motion.div>
      )}

      {/* Optimization Tips */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Quick Optimization Tips
        </h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Use wired connection instead of WiFi for lower latency</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Close bandwidth-heavy applications while gaming</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Consider using Cloudflare DNS (1.1.1.1) for faster resolution</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Play during off-peak hours for better server performance</span>
          </li>
        </ul>
      </div>
    </div>
  );
};