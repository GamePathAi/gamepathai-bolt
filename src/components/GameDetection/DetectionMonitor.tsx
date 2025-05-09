import React, { useEffect, useState } from 'react';
import { useDetectionStore } from '../../lib/gameDetection';
import { AlertTriangle, Shield, Activity } from 'lucide-react';

export const DetectionMonitor: React.FC = () => {
  const { 
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    analyze,
    detectionResults,
    updateThresholds,
    thresholds 
  } = useDetectionStore();

  const [analysisInterval, setAnalysisInterval] = useState<number | null>(null);

  useEffect(() => {
    if (isMonitoring && !analysisInterval) {
      const interval = window.setInterval(() => {
        analyze();
      }, 5000); // Analyze every 5 seconds
      setAnalysisInterval(interval);
    } else if (!isMonitoring && analysisInterval) {
      clearInterval(analysisInterval);
      setAnalysisInterval(null);
    }

    return () => {
      if (analysisInterval) {
        clearInterval(analysisInterval);
      }
    };
  }, [isMonitoring, analyze]);

  const latestResult = detectionResults[detectionResults.length - 1];

  return (
    <div className="bg-gray-800/60 backdrop-blur-sm border border-red-500/20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Shield className="text-red-400 mr-2" size={24} />
          <h2 className="text-lg font-medium text-white">AI Detection Monitor</h2>
        </div>
        <button
          onClick={() => isMonitoring ? stopMonitoring() : startMonitoring()}
          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-150 ${
            isMonitoring 
              ? 'bg-red-500 hover:bg-red-400 text-white'
              : 'bg-green-500 hover:bg-green-400 text-white'
          }`}
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </button>
      </div>

      {latestResult && (
        <div className="space-y-4">
          {/* Risk Score */}
          <div className="bg-gray-900/70 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Risk Score</span>
              <span className={`font-bold ${
                latestResult.riskScore > 75 ? 'text-red-400' :
                latestResult.riskScore > 50 ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {latestResult.riskScore.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  latestResult.riskScore > 75 ? 'bg-red-500' :
                  latestResult.riskScore > 50 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${latestResult.riskScore}%` }}
              />
            </div>
          </div>

          {/* Anomalies */}
          {latestResult.anomalies.length > 0 && (
            <div className="bg-gray-900/70 rounded-lg p-4">
              <h3 className="text-white font-medium mb-3 flex items-center">
                <AlertTriangle className="text-yellow-400 mr-2" size={16} />
                Detected Anomalies
              </h3>
              <ul className="space-y-2">
                {latestResult.anomalies.map((anomaly, index) => (
                  <li key={index} className="text-gray-300 text-sm flex items-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
                    {anomaly}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Evidence */}
          <div className="bg-gray-900/70 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3 flex items-center">
              <Activity className="text-cyan-400 mr-2" size={16} />
              Detection Evidence
            </h3>
            <div className="space-y-3">
              {latestResult.evidence.map((evidence, index) => (
                <div key={index} className="border border-gray-700 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{evidence.type}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      evidence.severity > 0.7 ? 'bg-red-500/20 text-red-400' :
                      evidence.severity > 0.4 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      Severity: {(evidence.severity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{evidence.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Confidence */}
          <div className="bg-gray-900/70 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Detection Confidence</span>
              <span className="text-cyan-400 font-bold">{latestResult.confidence.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-500"
                style={{ width: `${latestResult.confidence}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Thresholds Configuration */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h3 className="text-white font-medium mb-4">Detection Thresholds</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Risk Score Threshold</label>
            <input
              type="range"
              min="0"
              max="100"
              value={thresholds.riskScore}
              onChange={(e) => updateThresholds({ riskScore: Number(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer"
            />
            <div className="text-sm text-gray-400 mt-1">{thresholds.riskScore}%</div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Reaction Time Threshold</label>
            <input
              type="range"
              min="50"
              max="300"
              value={thresholds.reactionTime}
              onChange={(e) => updateThresholds({ reactionTime: Number(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer"
            />
            <div className="text-sm text-gray-400 mt-1">{thresholds.reactionTime}ms</div>
          </div>
        </div>
      </div>
    </div>
  );
};