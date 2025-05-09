import React from 'react';
import { ChevronUp, ChevronDown, DivideIcon as LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string;
  trend: string;
  trendPositive: boolean;
  icon: LucideIcon;
  color: 'cyan' | 'purple' | 'red' | 'green';
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  trend,
  trendPositive,
  icon: Icon,
  color,
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'cyan':
        return {
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-500/30',
          text: 'text-cyan-400',
          iconBg: 'bg-cyan-500/20',
        };
      case 'purple':
        return {
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/30',
          text: 'text-purple-400',
          iconBg: 'bg-purple-500/20',
        };
      case 'red':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-red-400',
          iconBg: 'bg-red-500/20',
        };
      case 'green':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          text: 'text-green-400',
          iconBg: 'bg-green-500/20',
        };
      default:
        return {
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/30',
          text: 'text-gray-400',
          iconBg: 'bg-gray-500/20',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className={`${colors.bg} backdrop-blur-sm border ${colors.border} rounded-lg p-4 relative overflow-hidden`}>
      <div className="absolute -top-8 -right-8 w-16 h-16 rounded-full bg-gradient-to-br from-white/5 to-white/0"></div>
      
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm text-gray-400 font-medium">{title}</h3>
          <p className={`text-xl font-bold mt-1 ${colors.text}`}>{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${colors.iconBg} flex items-center justify-center`}>
          <Icon className={colors.text} size={20} />
        </div>
      </div>
      
      <div className="mt-2 flex items-center">
        {trendPositive ? (
          <ChevronUp className="text-green-400" size={16} />
        ) : (
          <ChevronDown className="text-red-400" size={16} />
        )}
        <span className={trendPositive ? 'text-green-400 text-xs' : 'text-red-400 text-xs'}>
          {trend}
        </span>
        <span className="text-gray-500 text-xs ml-1">vs avg</span>
      </div>
    </div>
  );
};