import React from 'react';
import { BarChart4, Zap, Users, Shield } from 'lucide-react';

interface PerformanceMetric {
  name: string;
  current: number;
  baseline: number;
  target: number;
  unit: string;
  icon: React.ElementType;
  color: string;
}

const metrics: PerformanceMetric[] = [
  {
    name: 'Frame Rate',
    current: 86,
    baseline: 68,
    target: 78.2, // 15% increase from baseline
    unit: 'FPS',
    icon: BarChart4,
    color: 'cyan'
  },
  {
    name: 'Network Latency',
    current: 24,
    baseline: 42,
    target: 31.5, // 25% decrease from baseline
    unit: 'ms',
    icon: Zap,
    color: 'purple'
  },
  {
    name: 'User Retention',
    current: 85,
    baseline: 62,
    target: 80.6, // 30% increase from baseline
    unit: '%',
    icon: Users,
    color: 'green'
  },
  {
    name: 'System Stability',
    current: 98,
    baseline: 92,
    target: 95,
    unit: '%',
    icon: Shield,
    color: 'red'
  }
];

export const PerformanceReport: React.FC = () => {
  const calculateImprovement = (current: number, baseline: number) => {
    return ((current - baseline) / baseline) * 100;
  };

  const meetsTarget = (metric: PerformanceMetric) => {
    if (metric.name === 'Network Latency') {
      return metric.current <= metric.target;
    }
    return metric.current >= metric.target;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const improvement = calculateImprovement(metric.current, metric.baseline);
          const Icon = metric.icon;
          const success = meetsTarget(metric);
          
          return (
            <div 
              key={metric.name}
              className={`bg-gray-800/60 backdrop-blur-sm border rounded-lg p-4
                ${success ? `border-${metric.color}-500/20` : 'border-yellow-500/20'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-${metric.color}-500/20 flex items-center justify-center`}>
                  <Icon className={`text-${metric.color}-400`} size={20} />
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  success ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {success ? 'Target Met' : 'Needs Improvement'}
                </span>
              </div>
              
              <h3 className="text-sm text-gray-400">{metric.name}</h3>
              <div className="mt-1 flex items-baseline">
                <p className="text-2xl font-semibold text-white">
                  {metric.current}{metric.unit}
                </p>
                <span className={`ml-2 text-sm ${
                  improvement > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
                </span>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Baseline: {metric.baseline}{metric.unit}</span>
                  <span>Target: {metric.target}{metric.unit}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-${metric.color}-500 transition-all duration-300`}
                    style={{ 
                      width: `${(metric.current / (metric.baseline * 2)) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Analysis */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-medium text-white mb-4">Performance Analysis</h2>
        
        <div className="space-y-6">
          {/* Frame Rate Analysis */}
          <div>
            <h3 className="text-sm font-medium text-white mb-2">Frame Rate Performance</h3>
            <p className="text-gray-400 text-sm mb-2">
              Frame rate shows significant improvement with a 26.5% increase from baseline,
              exceeding the target threshold of 15%. Peak FPS reached 92, with minimum FPS
              maintained above 75.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Peak FPS</div>
                <div className="text-lg font-medium text-white">92</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Average FPS</div>
                <div className="text-lg font-medium text-white">86</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Minimum FPS</div>
                <div className="text-lg font-medium text-white">75</div>
              </div>
            </div>
          </div>

          {/* Network Performance */}
          <div>
            <h3 className="text-sm font-medium text-white mb-2">Network Performance</h3>
            <p className="text-gray-400 text-sm mb-2">
              Network latency reduced by 42.9%, significantly exceeding the target 25% reduction.
              Improved routing algorithms and connection optimization contributed to this success.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Average Latency</div>
                <div className="text-lg font-medium text-white">24ms</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Packet Loss</div>
                <div className="text-lg font-medium text-white">0.2%</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Jitter</div>
                <div className="text-lg font-medium text-white">3.2ms</div>
              </div>
            </div>
          </div>

          {/* User Engagement */}
          <div>
            <h3 className="text-sm font-medium text-white mb-2">User Engagement</h3>
            <p className="text-gray-400 text-sm mb-2">
              User retention increased by 37.1%, surpassing the target of 30%. New users show
              40% higher retention rates compared to baseline, while existing user retention
              improved by 35%.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">New User Retention</div>
                <div className="text-lg font-medium text-white">82%</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Existing User Retention</div>
                <div className="text-lg font-medium text-white">88%</div>
              </div>
            </div>
          </div>

          {/* System Reliability */}
          <div>
            <h3 className="text-sm font-medium text-white mb-2">System Reliability</h3>
            <p className="text-gray-400 text-sm mb-2">
              System stability score of 98% exceeds the target threshold of 95%. Only two minor
              non-critical errors were recorded, with zero crashes or major anomalies.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Uptime</div>
                <div className="text-lg font-medium text-white">99.9%</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Error Rate</div>
                <div className="text-lg font-medium text-white">0.02%</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Crash Rate</div>
                <div className="text-lg font-medium text-white">0%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};