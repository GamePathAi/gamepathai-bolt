import React, { useState, useEffect } from 'react';
import { BarChart4, Zap, Users, Shield } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  change: number;
  baseline: number;
  target: number;
  icon: React.ElementType;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  change,
  baseline,
  target,
  icon: Icon,
  color,
}) => {
  const isPositive = change > 0;
  const changeText = `${isPositive ? '+' : ''}${change.toFixed(1)}%`;

  return (
    <div className={`bg-gray-800/60 backdrop-blur-sm border border-${color}-500/20 rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
            <Icon className={`text-${color}-400`} size={18} />
          </div>
          <span className="text-sm text-gray-400">{title}</span>
        </div>
        <div className={`px-2 py-1 rounded text-xs ${
          value >= target ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {value >= target ? 'Target Met' : 'Target: ' + target + unit}
        </div>
      </div>

      <div className="flex items-baseline space-x-2 mb-3">
        <span className="text-2xl font-bold text-white">{value}{unit}</span>
        <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {changeText}
        </span>
      </div>

      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>Baseline: {baseline}{unit}</span>
        <span>Target: {target}{unit}</span>
      </div>

      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-${color}-500 transition-all duration-300`}
          style={{ width: `${(value / (baseline * 2)) * 100}%` }}
        />
      </div>
    </div>
  );
};

export const PerformanceMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState({
    frameRate: {
      value: 86,
      baseline: 68,
      target: 78.2,
      change: 26.5
    },
    latency: {
      value: 24,
      baseline: 42,
      target: 31.5,
      change: -42.9
    },
    retention: {
      value: 85,
      baseline: 62,
      target: 80.6,
      change: 37.1
    },
    stability: {
      value: 98,
      baseline: 92,
      target: 95,
      change: 6.5
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        frameRate: {
          ...prev.frameRate,
          value: Math.max(60, Math.min(120, prev.frameRate.value + (Math.random() * 6 - 3))),
        },
        latency: {
          ...prev.latency,
          value: Math.max(1, Math.min(60, prev.latency.value + (Math.random() * 4 - 2))),
        },
        retention: {
          ...prev.retention,
          value: Math.max(50, Math.min(100, prev.retention.value + (Math.random() * 2 - 1))),
        },
        stability: {
          ...prev.stability,
          value: Math.max(90, Math.min(100, prev.stability.value + (Math.random() * 1 - 0.5))),
        }
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Frame Rate"
        value={Math.round(metrics.frameRate.value)}
        unit="FPS"
        change={metrics.frameRate.change}
        baseline={metrics.frameRate.baseline}
        target={metrics.frameRate.target}
        icon={BarChart4}
        color="cyan"
      />

      <MetricCard
        title="Network Latency"
        value={Math.round(metrics.latency.value)}
        unit="ms"
        change={metrics.latency.change}
        baseline={metrics.latency.baseline}
        target={metrics.latency.target}
        icon={Zap}
        color="purple"
      />

      <MetricCard
        title="User Retention"
        value={Math.round(metrics.retention.value)}
        unit="%"
        change={metrics.retention.change}
        baseline={metrics.retention.baseline}
        target={metrics.retention.target}
        icon={Users}
        color="green"
      />

      <MetricCard
        title="System Stability"
        value={Math.round(metrics.stability.value)}
        unit="%"
        change={metrics.stability.change}
        baseline={metrics.stability.baseline}
        target={metrics.stability.target}
        icon={Shield}
        color="red"
      />
    </div>
  );
};