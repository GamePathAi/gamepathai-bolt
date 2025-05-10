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
  details?: {
    peak?: number;
    average?: number;
    minimum?: number;
  };
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
  details
}) => {
  const isPositive = change > 0;
  const changeText = `${isPositive ? '+' : ''}${change.toFixed(1)}%`;
  const progress = (value / target) * 100;

  return (
    <div className={`bg-gray-800/60 backdrop-blur-sm border border-${color}-500/20 rounded-lg p-4 relative overflow-hidden group`}>
      {/* Background Glow Effect */}
      <div className={`absolute -right-10 -top-10 w-40 h-40 bg-${color}-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
            <Icon className={`text-${color}-400 transform group-hover:scale-110 transition-transform duration-300`} size={18} />
          </div>
          <span className="text-sm text-gray-400">{title}</span>
        </div>
        <div className={`px-2 py-1 rounded text-xs ${
          value >= target ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
        } animate-pulse`}>
          {value >= target ? 'Target Met' : 'Target: ' + target + unit}
        </div>
      </div>

      <div className="flex items-baseline space-x-2 mb-3">
        <span className="text-2xl font-bold text-white transition-all duration-300">
          {value}{unit}
        </span>
        <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'} font-medium`}>
          {changeText}
        </span>
      </div>

      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>Baseline: {baseline}{unit}</span>
        <span>Target: {target}{unit}</span>
      </div>

      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r from-${color}-600 to-${color}-400 transition-all duration-700 ease-in-out`}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>

      {details && (
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-700/50">
          {details.peak !== undefined && (
            <div className="text-center">
              <div className="text-xs text-gray-400">Peak</div>
              <div className={`text-sm font-medium text-${color}-400`}>{details.peak}{unit}</div>
            </div>
          )}
          {details.average !== undefined && (
            <div className="text-center">
              <div className="text-xs text-gray-400">Average</div>
              <div className={`text-sm font-medium text-${color}-400`}>{details.average}{unit}</div>
            </div>
          )}
          {details.minimum !== undefined && (
            <div className="text-center">
              <div className="text-xs text-gray-400">Minimum</div>
              <div className={`text-sm font-medium text-${color}-400`}>{details.minimum}{unit}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const PerformanceMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState({
    frameRate: {
      value: 86,
      baseline: 68,
      target: 78.2,
      change: 26.5,
      details: {
        peak: 92,
        average: 86,
        minimum: 75
      }
    },
    latency: {
      value: 24,
      baseline: 42,
      target: 31.5,
      change: -42.9,
      details: {
        peak: 35,
        average: 24,
        minimum: 18
      }
    },
    retention: {
      value: 85,
      baseline: 62,
      target: 80.6,
      change: 37.1,
      details: {
        peak: 88,
        average: 85,
        minimum: 82
      }
    },
    stability: {
      value: 98,
      baseline: 92,
      target: 95,
      change: 6.5,
      details: {
        peak: 99.9,
        average: 98,
        minimum: 96.5
      }
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => {
        const updateMetric = (metric: typeof prev.frameRate) => {
          // Calculate new value with smooth transitions
          const volatility = 0.05; // 5% maximum change
          const maxChange = metric.value * volatility;
          const change = (Math.random() * maxChange * 2) - maxChange;
          const newValue = Math.max(
            metric.baseline * 0.8,
            Math.min(metric.target * 1.2, metric.value + change)
          );

          // Update details
          const newPeak = Math.max(metric.details.peak, newValue);
          const newMin = Math.min(metric.details.minimum, newValue);
          const newAvg = (newValue + metric.details.average) / 2;

          return {
            ...metric,
            value: Number(newValue.toFixed(1)),
            change: ((newValue - metric.baseline) / metric.baseline) * 100,
            details: {
              peak: Number(newPeak.toFixed(1)),
              average: Number(newAvg.toFixed(1)),
              minimum: Number(newMin.toFixed(1))
            }
          };
        };

        return {
          frameRate: updateMetric(prev.frameRate),
          latency: updateMetric(prev.latency),
          retention: updateMetric(prev.retention),
          stability: updateMetric(prev.stability)
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Frame Rate"
        value={metrics.frameRate.value}
        unit="FPS"
        change={metrics.frameRate.change}
        baseline={metrics.frameRate.baseline}
        target={metrics.frameRate.target}
        icon={BarChart4}
        color="cyan"
        details={metrics.frameRate.details}
      />

      <MetricCard
        title="Network Latency"
        value={metrics.latency.value}
        unit="ms"
        change={metrics.latency.change}
        baseline={metrics.latency.baseline}
        target={metrics.latency.target}
        icon={Zap}
        color="purple"
        details={metrics.latency.details}
      />

      <MetricCard
        title="User Retention"
        value={metrics.retention.value}
        unit="%"
        change={metrics.retention.change}
        baseline={metrics.retention.baseline}
        target={metrics.retention.target}
        icon={Users}
        color="green"
        details={metrics.retention.details}
      />

      <MetricCard
        title="System Stability"
        value={metrics.stability.value}
        unit="%"
        change={metrics.stability.change}
        baseline={metrics.stability.baseline}
        target={metrics.stability.target}
        icon={Shield}
        color="red"
        details={metrics.stability.details}
      />
    </div>
  );
};