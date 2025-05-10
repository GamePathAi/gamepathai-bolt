import React, { useState, useEffect } from 'react';
import { Network, Zap, Cpu, Globe } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend: string;
  icon: React.ReactNode;
  color: string;
  trendDirection: 'up' | 'down';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend, icon, color, trendDirection }) => {
  return (
    <div className={`bg-gray-800/60 backdrop-blur-sm border border-${color}-500/20 rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <h3 className="text-sm text-gray-400">{title}</h3>
            <div className="flex items-baseline space-x-2">
              <span className={`text-2xl font-bold text-${color}-400`}>{value}</span>
              <span className={`text-xs ${trendDirection === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {trend}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NetworkMetricsGrid: React.FC = () => {
  const [metrics, setMetrics] = useState({
    latency: 24,
    fpsBoost: 27,
    cpuUsage: 42,
    packetLoss: 0.2
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        latency: Math.max(1, prev.latency + (Math.random() * 6 - 3)),
        fpsBoost: Math.max(0, prev.fpsBoost + (Math.random() * 4 - 2)),
        cpuUsage: Math.max(0, Math.min(100, prev.cpuUsage + (Math.random() * 8 - 4))),
        packetLoss: Math.max(0, Math.min(5, prev.packetLoss + (Math.random() * 0.4 - 0.2)))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Network Latency"
        value={`${Math.round(metrics.latency)} ms`}
        trend="-12% vs avg"
        icon={<Network className="text-cyan-400" size={20} />}
        color="cyan"
        trendDirection="down"
      />
      
      <MetricCard
        title="FPS Boost"
        value={`+${Math.round(metrics.fpsBoost)}%`}
        trend="+5% vs avg"
        icon={<Zap className="text-purple-400" size={20} />}
        color="purple"
        trendDirection="up"
      />
      
      <MetricCard
        title="CPU Usage"
        value={`${Math.round(metrics.cpuUsage)}%`}
        trend="-8% vs avg"
        icon={<Cpu className="text-red-400" size={20} />}
        color="red"
        trendDirection="down"
      />
      
      <MetricCard
        title="Packet Loss"
        value={`${metrics.packetLoss.toFixed(1)}%`}
        trend="-0.5% vs avg"
        icon={<Globe className="text-green-400" size={20} />}
        color="green"
        trendDirection="down"
      />
    </div>
  );
};